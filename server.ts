import express from "express";
import { createServer as createViteServer } from "vite";
import Database from "better-sqlite3";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

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
    batch_type TEXT,
    special_notes TEXT,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP
  );

  CREATE TABLE IF NOT EXISTS scans (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    batch_id TEXT,
    status TEXT,
    location TEXT,
    worker_name TEXT,
    machine_no TEXT,
    ok_qty INTEGER DEFAULT 0,
    issued_qty INTEGER DEFAULT 0,
    rejected_qty INTEGER DEFAULT 0,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (batch_id) REFERENCES batches(id)
  );
`);

// Migration: Add batch_type column if it doesn't exist
try {
  const tableInfo = db.prepare("PRAGMA table_info(batches)").all() as any[];
  const hasBatchType = tableInfo.some(col => col.name === 'batch_type');
  if (!hasBatchType) {
    db.exec("ALTER TABLE batches ADD COLUMN batch_type TEXT DEFAULT 'Bulk'");
    console.log("Migration: Added batch_type column to batches table.");
  }
} catch (error) {
  console.error("Migration error:", error);
}

// Migration: Add new columns to scans table if they don't exist
try {
  const scanTableInfo = db.prepare("PRAGMA table_info(scans)").all() as any[];
  const columnsToAdd = [
    { name: 'machine_no', type: 'TEXT' },
    { name: 'ok_qty', type: 'INTEGER DEFAULT 0' },
    { name: 'issued_qty', type: 'INTEGER DEFAULT 0' },
    { name: 'rejected_qty', type: 'INTEGER DEFAULT 0' }
  ];

  for (const col of columnsToAdd) {
    if (!scanTableInfo.some(c => c.name === col.name)) {
      db.exec(`ALTER TABLE scans ADD COLUMN ${col.name} ${col.type}`);
      console.log(`Migration: Added ${col.name} column to scans table.`);
    }
  }
} catch (error) {
  console.error("Migration error (scans):", error);
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/batches", async (req, res) => {
    const { id, buyer, style, color, apm_name, senior_executive, quantity, batch_type, special_notes } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO batches (id, buyer, style, color, apm_name, senior_executive, quantity, batch_type, special_notes)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(id, buyer, style, color, apm_name, senior_executive, quantity, batch_type, special_notes);
      
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

  app.post("/api/scans", async (req, res) => {
    const { batch_id, status, location, worker_name, machine_no, ok_qty, issued_qty, rejected_qty } = req.body;
    try {
      const stmt = db.prepare(`
        INSERT INTO scans (batch_id, status, location, worker_name, machine_no, ok_qty, issued_qty, rejected_qty)
        VALUES (?, ?, ?, ?, ?, ?, ?, ?)
      `);
      stmt.run(batch_id, status, location, worker_name, machine_no || null, ok_qty || 0, issued_qty || 0, rejected_qty || 0);

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
    const distPath = path.join(__dirname, "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://0.0.0.0:${PORT} [${process.env.NODE_ENV || 'development'}]`);
  });
}

startServer();
