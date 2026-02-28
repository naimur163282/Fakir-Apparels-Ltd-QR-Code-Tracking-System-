import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, MapPin, User, Send, Package, ArrowRight } from 'lucide-react';
import { Batch } from '../types';
import { cn } from '../lib/utils';

const PROCESSES = [
  'Batch Creating',
  'Wash',
  'Hydro',
  'Dryer',
  'Quality Check',
  'Acid Wash'
];

const SUB_STATUSES = [
  'Waiting',
  'Running',
  'End'
];

const LOCATIONS = [
  'Wash Machine',
  'Hydro Area',
  'Dryer Area',
  'Quality Area'
];

const WASH_MACHINES = [
  'Tonello - 1',
  'Tonello - 2',
  'Team Star - 1',
  'Team Star - 2',
  'Belly - 1',
  'Belly - 2',
  'Belly - 3',
  'Belly - 4',
  'Belly - 5',
  'Belly - 6',
  'Medium - 1',
  'Medium - 2',
  'Medium - 3'
];

export default function UpdateStatus() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const [formData, setFormData] = useState({
    process: '',
    subStatus: '',
    location: '',
    machineNo: '',
    worker_name: ''
  });

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        const res = await fetch(`/api/batches/${id}`);
        const data = await res.json();
        setBatch(data);
      } catch (error) {
        console.error('Error fetching batch:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchBatch();
  }, [id]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    const finalLocation = formData.location === 'Wash Machine' && formData.machineNo 
      ? `Wash Machine (${formData.machineNo})` 
      : formData.location;

    try {
      const response = await fetch('/api/scans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          batch_id: id,
          status: `${formData.process} - ${formData.subStatus}`,
          location: finalLocation,
          worker_name: formData.worker_name
        })
      });

      if (response.ok) {
        setSuccess(true);
        setTimeout(() => navigate('/'), 2000);
      }
    } catch (error) {
      console.error('Error submitting status:', error);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) return <div className="p-12 text-center">Loading batch details...</div>;
  if (!batch) return <div className="p-12 text-center">Batch not found.</div>;

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-6">
        <motion.div 
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <h2 className="text-3xl font-bold">Status Updated!</h2>
        <p className="text-muted-foreground">The production dashboard has been updated with your submission.</p>
        <p className="text-sm font-mono bg-black/5 p-2 rounded">Batch: {batch.id}</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto">
      <header className="mb-8">
        <div className="flex items-center gap-3 mb-4">
          <div className="p-2 bg-emerald-600 text-white rounded-xl">
            <Package size={24} />
          </div>
          <h2 className="text-2xl font-bold tracking-tight">Update Status</h2>
        </div>
        
        <div className="bg-white p-4 rounded-2xl border border-black/5 shadow-sm">
          <div className="flex justify-between items-start">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Style</p>
              <p className="font-bold text-lg">{batch.style}</p>
              <span className="text-[9px] font-bold uppercase tracking-widest bg-black/5 px-2 py-0.5 rounded text-slate-500">
                {batch.batch_type}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Batch ID</p>
              <p className="font-mono font-bold text-sm">{batch.id}</p>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-black/5 grid grid-cols-2 gap-4">
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Buyer</p>
              <p className="text-sm font-medium">{batch.buyer}</p>
            </div>
            <div>
              <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">Qty</p>
              <p className="text-sm font-medium">{batch.quantity} pcs</p>
            </div>
          </div>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-3xl border border-black/5 shadow-xl overflow-hidden"
      >
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <CheckCircle2 size={14} />
              1. Select Process
            </label>
            <div className="grid grid-cols-2 gap-2">
              {PROCESSES.map((proc) => (
                <button
                  key={proc}
                  type="button"
                  onClick={() => setFormData({ ...formData, process: proc })}
                  className={cn(
                    "px-3 py-3 rounded-xl text-xs font-bold text-center transition-all border",
                    formData.process === proc 
                      ? "bg-emerald-600 border-emerald-600 text-white shadow-md" 
                      : "bg-black/[0.02] border-black/5 text-slate-600 hover:bg-black/[0.05]"
                  )}
                >
                  {proc}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <ArrowRight size={14} />
              2. Current Status
            </label>
            <div className="grid grid-cols-3 gap-2">
              {SUB_STATUSES.map((sub) => (
                <button
                  key={sub}
                  type="button"
                  onClick={() => setFormData({ ...formData, subStatus: sub })}
                  className={cn(
                    "px-3 py-3 rounded-xl text-xs font-bold text-center transition-all border",
                    formData.subStatus === sub 
                      ? "bg-black border-black text-white shadow-md" 
                      : "bg-black/[0.02] border-black/5 text-slate-600 hover:bg-black/[0.05]"
                  )}
                >
                  {sub}
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <MapPin size={14} />
              3. Current Area
            </label>
            <select
              required
              className="w-full px-4 py-3 bg-black/[0.02] border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none"
              value={formData.location}
              onChange={(e) => setFormData({ ...formData, location: e.target.value, machineNo: '' })}
            >
              <option value="">Select Area</option>
              {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
            </select>
          </div>

          {formData.location === 'Wash Machine' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-2"
            >
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Package size={14} />
                Select Machine No
              </label>
              <select
                required
                className="w-full px-4 py-3 bg-black/[0.02] border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none"
                value={formData.machineNo}
                onChange={(e) => setFormData({ ...formData, machineNo: e.target.value })}
              >
                <option value="">Select Machine</option>
                {WASH_MACHINES.map(m => <option key={m} value={m}>{m}</option>)}
              </select>
            </motion.div>
          )}

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <User size={14} />
              4. Worker Name / ID
            </label>
            <input 
              type="text"
              required
              className="w-full px-4 py-3 bg-black/[0.02] border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
              placeholder="Enter your name"
              value={formData.worker_name}
              onChange={(e) => setFormData({ ...formData, worker_name: e.target.value })}
            />
          </div>

          <button 
            type="submit" 
            disabled={submitting || !formData.process || !formData.subStatus || !formData.location || (formData.location === 'Wash Machine' && !formData.machineNo) || !formData.worker_name}
            className="w-full bg-emerald-600 text-white py-4 rounded-2xl font-bold text-lg transition-all flex items-center justify-center gap-2 disabled:opacity-30 active:scale-95"
          >
            {submitting ? 'Submitting...' : (
              <>
                <Send size={20} />
                Update Status
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
