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
  app.get("/api/diag", async (req, res) => {
    const config = {
      supabaseUrl: supabaseUrl ? "Present (starts with " + supabaseUrl.substring(0, 10) + "...)" : "Missing",
      supabaseKey: supabaseKey ? "Present" : "Missing",
      env: process.env.NODE_ENV || 'development'
    };
    
    try {
      const { data, error } = await supabase.from('batches').select('id').limit(1);
      res.json({
        config,
        database: error ? { status: "Error", message: error.message, code: error.code } : { status: "Connected", count: data?.length }
      });
    } catch (e: any) {
      res.json({
        config,
        database: { status: "Exception", message: e.message }
      });
    }
  });

  app.post("/api/batches", async (req, res) => {
    if (!supabaseUrl || !supabaseKey) {
      return res.status(500).json({ 
        error: "Server Configuration Error", 
        details: "SUPABASE_URL or SUPABASE_ANON_KEY is missing in environment variables.",
        hint: "Please check your .env file or platform environment settings."
      });
    }
    const { id, buyer, style, color, apm_name, senior_executive, quantity, batch_type, special_notes, estimated_total_time, process_steps } = req.body;
    try {
      console.log("--- BATCH CREATION REQUEST ---");
      console.log("Payload:", JSON.stringify(req.body, null, 2));
      
      const insertData = { 
        id, buyer, style, color, apm_name, senior_executive, quantity, batch_type, special_notes,
        estimated_total_time,
        process_steps
      };

      const { data, error } = await supabase
        .from('batches')
        .insert([insertData])
        .select();

      if (error) {
        console.error("Supabase Insert Error:", JSON.stringify(error, null, 2));
        throw error;
      }
      
      console.log("Batch created successfully in Supabase:", data);
      
      // Sync to Google Sheets
      try {
        await syncToGoogleSheets('batch', { 
          id, buyer, style, color, apm_name, senior_executive, quantity, batch_type, special_notes,
          estimated_total_time,
          process_steps,
          created_at: new Date().toISOString()
        });
      } catch (syncErr) {
        console.error("Google Sheets Sync failed (non-blocking):", syncErr);
      }

      res.status(201).json({ success: true });
    } catch (error: any) {
      console.error("Batch Creation Failed:", error);
      // Log the full error object for debugging
      console.log("Full error details:", JSON.stringify(error, null, 2));
      
      res.status(500).json({ 
        error: "Failed to create batch", 
        details: error.message || "Unknown database error",
        hint: error.hint || "",
        code: error.code || "NO_CODE"
      });
    }
  });

  app.delete("/api/batches/:id", async (req, res) => {
    const { id } = req.params;
    const { reason, worker_name } = req.body;
    
    try {
      // 1. Record the deletion in scans as a log
      await supabase
        .from('scans')
        .insert([{ 
          batch_id: id, 
          status: 'Batch Removed', 
          location: 'System', 
          worker_name: worker_name || 'Admin', 
          special_notes: reason || 'No reason provided'
        }]);

      // 2. Delete the batch (Supabase should handle cascading if configured, but let's be safe)
      // First delete scans
      await supabase.from('scans').delete().eq('batch_id', id);
      
      // Then delete batch
      const { error } = await supabase
        .from('batches')
        .delete()
        .eq('id', id);

      if (error) throw error;

      res.json({ success: true });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to delete batch" });
    }
  });

  app.post("/api/admin/reset", async (req, res) => {
    try {
      // Delete all scans first due to FK
      await supabase.from('scans').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      // Delete all batches
      await supabase.from('batches').delete().neq('id', 'placeholder');
      
      res.json({ success: true, message: "All data cleared successfully" });
    } catch (error) {
      console.error(error);
      res.status(500).json({ error: "Failed to reset data" });
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
