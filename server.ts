import express from "express";
import { createServer as createViteServer } from "vite";
import { createClient } from "@supabase/supabase-js";
import path from "path";
import { fileURLToPath } from "url";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const supabaseUrl = process.env.SUPABASE_URL || "";
const supabaseKey = process.env.SUPABASE_ANON_KEY || "";

if (!supabaseUrl || !supabaseKey) {
  console.error("CRITICAL: SUPABASE_URL or SUPABASE_ANON_KEY is missing. Database operations will fail.");
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function syncToGoogleSheets(type: 'batch' | 'scan', data: any) {
  const scriptUrl = process.env.GOOGLE_SCRIPT_URL || "https://script.google.com/macros/s/AKfycbx8ZFe6ySakOHisWomYdV9Hw3z0wqp5RpO26-ZKUIiTboyxmO0A8_S1A2nGx4u71k8/exec";
  if (!scriptUrl) {
    console.warn("Google Sheets sync skipped: GOOGLE_SCRIPT_URL is not set.");
    return;
  }

  try {
    const response = await fetch(scriptUrl, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type, data })
    });
    
    if (!response.ok) {
      console.error(`Google Sheets sync failed with status: ${response.status}`);
    } else {
      console.log(`Google Sheets sync successful for ${type}`);
    }
  } catch (error) {
    console.error("Google Sheets sync error:", error);
  }
}

async function startServer() {
  const app = express();
  const PORT = Number(process.env.PORT) || 3000;

  app.use(express.json());

  // API Routes
  app.post("/api/batches", async (req, res) => {
    const { id, buyer, style, color, apm_name, senior_executive, quantity, batch_type, special_notes } = req.body;
    try {
      const { error } = await supabase
        .from('batches')
        .insert([{ id, buyer, style, color, apm_name, senior_executive, quantity, batch_type, special_notes }]);

      if (error) throw error;
      
      // Sync to Google Sheets
      await syncToGoogleSheets('batch', { 
        id, buyer, style, color, apm_name, senior_executive, quantity, batch_type, special_notes,
        created_at: new Date().toISOString()
      });

      res.status(201).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to create batch" });
    }
  });

  app.get("/api/batches", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch batches" });
    }
  });

  app.get("/api/batches/:id", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('batches')
        .select('*')
        .eq('id', req.params.id)
        .single();

      if (error) throw error;
      if (!data) return res.status(404).json({ error: "Batch not found" });
      res.json(data);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch batch" });
    }
  });

  app.post("/api/scans", async (req, res) => {
    const { batch_id, status, location, worker_name, machine_no, ok_qty, issued_qty, rejected_qty, shift } = req.body;
    try {
      const { error } = await supabase
        .from('scans')
        .insert([{ 
          batch_id, 
          status, 
          location, 
          worker_name, 
          machine_no: machine_no || null, 
          ok_qty: ok_qty || 0, 
          issued_qty: issued_qty || 0, 
          rejected_qty: rejected_qty || 0,
          shift: shift || 'Day'
        }]);

      if (error) throw error;

      // Sync to Google Sheets
      await syncToGoogleSheets('scan', {
        batch_id, status, location, worker_name, machine_no, ok_qty, issued_qty, rejected_qty, shift,
        timestamp: new Date().toISOString()
      });

      res.status(201).json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to record scan" });
    }
  });

  app.get("/api/scans", async (req, res) => {
    try {
      const { data, error } = await supabase
        .from('scans')
        .select(`
          *,
          batches (
            style,
            buyer
          )
        `)
        .order('timestamp', { ascending: false });

      if (error) throw error;

      // Flatten the join result to match previous API structure
      const flattenedData = data.map((scan: any) => ({
        ...scan,
        style: scan.batches?.style,
        buyer: scan.batches?.buyer
      }));

      res.json(flattenedData);
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to fetch scans" });
    }
  });

  app.get("/api/backup", (req, res) => {
    res.status(400).json({ error: "Backup is now handled by Supabase Cloud" });
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
