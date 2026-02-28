import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import dotenv from "dotenv";

dotenv.config();

const dbPath = process.env.DATABASE_PATH || "garment_tracker.db";
const db = new Database(dbPath);

// Initialize database
db.exec(`
  CREATE TABLE IF NOT EXISTS batches (
    id TEXT PRIMARY KEY,
    buyer TEXT,
    style TEXT,
    color TEXT,
    apm_name TEXT,
    senior_executive TEXT,
    quantity INTEGER,
    special_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id TEXT,
    status TEXT,
    location TEXT,
    worker_name TEXT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    alert_sent INTEGER DEFAULT 0,
    FOREIGN KEY (batch_id) REFERENCES batches(id)
  );
`);

async function sendTelegramAlert(message: string) {
  const token = process.env.TELEGRAM_BOT_TOKEN;
  const chatId = process.env.TELEGRAM_CHAT_ID;
  
  if (!token || !chatId) {
    console.warn("Telegram bot token or chat ID not configured. Skipping alert.");
    return;
  }

  try {
    const url = `https://api.telegram.org/bot${token}/sendMessage`;
    const response = await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        chat_id: chatId,
        text: message,
        parse_mode: "Markdown"
      })
    });
    
    if (!response.ok) {
      const err = await response.text();
      console.error("Failed to send Telegram alert:", err);
    }
  } catch (error) {
    console.error("Error sending Telegram alert:", error);
  }
}

// Check for delays every 5 minutes
setInterval(async () => {
  console.log("Checking for production delays...");
  const thirtyMinutesAgo = new Date(Date.now() - 30 * 60 * 1000).toISOString().replace('T', ' ').split('.')[0];
  
  // Find scans that are "Waiting" for "Hydro" or "Dryer" for more than 30 mins and haven't been alerted
  const delayedScans = db.prepare(`
    SELECT s.*, b.style, b.buyer 
    FROM scans s 
    JOIN batches b ON s.batch_id = b.id 
    WHERE (s.status LIKE '%Hydro - Waiting%' OR s.status LIKE '%Dryer - Waiting%')
    AND s.timestamp < ?
    AND s.alert_sent = 0
    AND s.id = (SELECT MAX(id) FROM scans WHERE batch_id = s.batch_id)
  `).all(thirtyMinutesAgo) as any[];

  for (const scan of delayedScans) {
    const message = `🚨 *PRODUCTION DELAY ALERT* 🚨\n\n` +
                    `*Batch ID:* ${scan.batch_id}\n` +
                    `*Style:* ${scan.style}\n` +
                    `*Buyer:* ${scan.buyer}\n` +
                    `*Current Status:* ${scan.status}\n` +
                    `*Waiting Since:* ${scan.timestamp}\n` +
                    `*Location:* ${scan.location}\n\n` +
                    `⚠️ This batch has been waiting for more than 30 minutes. Please take action!`;
    
    await sendTelegramAlert(message);
    
    // Mark as alerted
    db.prepare("UPDATE scans SET alert_sent = 1 WHERE id = ?").run(scan.id);
  }
}, 5 * 60 * 1000);

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/batches", (req, res) => {
    const { id, buyer, style, color, apm_name, senior_executive, quantity, special_notes } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO batches (id, buyer, style, color, apm_name, senior_executive, quantity, special_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, buyer, style, color, apm_name, senior_executive, quantity, special_notes);
      res.status(201).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create batch" });
    }
  });

  app.get("/api/batches", (req, res) => {
    const batches = db.prepare("SELECT * FROM batches ORDER BY created_at DESC").all();
    res.json(batches);
  });

  app.get("/api/batches/:id", (req, res) => {
    const batch = db.prepare("SELECT * FROM batches WHERE id = ?").get(req.params.id);
    if (!batch) return res.status(404).json({ error: "Batch not found" });
    res.json(batch);
  });

  app.post("/api/scans", (req, res) => {
    const { batch_id, status, location, worker_name } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO scans (batch_id, status, location, worker_name)
        VALUES (?, ?, ?, ?)
      `);
      stmt.run(batch_id, status, location, worker_name);
      res.status(201).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to record scan" });
    }
  });

  app.get("/api/scans", (req, res) => {
    const scans = db.prepare(`
      SELECT s.*, b.style, b.buyer 
      FROM scans s 
      JOIN batches b ON s.batch_id = b.id 
      ORDER BY s.timestamp DESC
    `).all();
    res.json(scans);
  });

  app.get("/api/backup", (req, res) => {
    const fullPath = path.resolve(dbPath);
    res.download(fullPath, "production_backup.db");
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    app.use(express.static(path.join(__dirname, "dist")));
    app.get("*", (req, res) => {
      res.sendFile(path.join(__dirname, "dist", "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
