import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { CheckCircle2, MapPin, User, Send, Package, ArrowRight, Zap, Shield } from 'lucide-react';
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
    worker_name: '',
    ok_qty: '',
    issued_qty: '',
    rejected_qty: '',
    shift: 'Day' as 'Day' | 'Night'
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
          worker_name: formData.worker_name,
          machine_no: formData.machineNo,
          ok_qty: Number(formData.ok_qty) || 0,
          issued_qty: Number(formData.issued_qty) || 0,
          rejected_qty: Number(formData.rejected_qty) || 0,
          shift: formData.shift
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

  if (loading) return (
    <div className="flex flex-col items-center justify-center h-[60vh] gap-4">
      <div className="w-12 h-12 border-4 border-slate-200 border-t-indigo-600 rounded-full animate-spin" />
      <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Authenticating Batch...</p>
    </div>
  );
  
  if (!batch) return (
    <div className="max-w-md mx-auto mt-20 p-10 bg-white border border-slate-200 rounded-[2.5rem] text-center shadow-xl">
      <div className="w-16 h-16 bg-red-50 text-red-500 rounded-full flex items-center justify-center mx-auto mb-6">
        <Shield size={32} />
      </div>
      <h2 className="text-2xl font-black uppercase tracking-tighter italic mb-2 text-slate-900">Invalid Batch</h2>
      <p className="text-slate-500 text-sm font-medium">The batch ID you scanned does not exist in our production database.</p>
    </div>
  );

  if (success) {
    return (
      <div className="max-w-md mx-auto mt-20 text-center space-y-8 p-10 bg-white border border-slate-200 rounded-[2.5rem] shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-2 bg-emerald-500" />
        <motion.div 
          initial={{ scale: 0, rotate: -45 }}
          animate={{ scale: 1, rotate: 0 }}
          className="w-24 h-24 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto shadow-xl shadow-emerald-500/20"
        >
          <CheckCircle2 size={48} />
        </motion.div>
        <div className="space-y-2">
          <h2 className="text-4xl font-black uppercase tracking-tighter italic text-slate-900">Transmission Sent</h2>
          <p className="text-slate-500 font-medium">Production telemetry has been updated successfully.</p>
        </div>
        <div className="p-4 bg-slate-900 text-white rounded-2xl font-mono text-xs font-bold tracking-widest">
          LOG_ID: {batch.id}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto pb-20">
      <header className="mb-10">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-indigo-600 text-white rounded-2xl shadow-lg">
              <Zap size={24} />
            </div>
            <div>
              <h2 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900">Update Status</h2>
              <p className="text-[9px] font-black uppercase tracking-[0.3em] text-slate-400">Live Production Feed</p>
            </div>
          </div>
          <div className="px-3 py-1 bg-emerald-100 text-emerald-700 rounded-full text-[10px] font-black uppercase tracking-widest">
            Active
          </div>
        </div>
        
        <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-20 h-20 bg-indigo-600/[0.02] rounded-full -mr-10 -mt-10" />
          <div className="flex justify-between items-start relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Style Reference</p>
              <p className="font-black text-xl tracking-tighter uppercase italic text-slate-900">{batch.style}</p>
              <span className="inline-block mt-2 px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded">
                {batch.batch_type}
              </span>
            </div>
            <div className="text-right">
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Batch ID</p>
              <p className="font-mono font-black text-sm text-indigo-600">{batch.id}</p>
            </div>
          </div>
          <div className="mt-6 pt-6 border-t-2 border-dashed border-slate-100 grid grid-cols-2 gap-6 relative z-10">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Buyer</p>
              <p className="text-sm font-black uppercase tracking-tight text-slate-700">{batch.buyer}</p>
            </div>
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Quantity</p>
              <p className="text-sm font-black uppercase tracking-tight text-slate-700">{batch.quantity} PCS</p>
            </div>
          </div>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_40px_80px_-20px_rgba(0,0,0,0.05)] overflow-hidden"
      >
        <div className="h-2 bg-indigo-600" />
        <form onSubmit={handleSubmit} className="p-8 md:p-10 space-y-10">
          <div className="space-y-6">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              1. Select Shift
            </label>
            <div className="grid grid-cols-2 gap-3">
              {(['Day', 'Night'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setFormData({ ...formData, shift: s })}
                  className={cn(
                    "px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center transition-all border-2",
                    formData.shift === s 
                      ? "bg-slate-900 border-slate-900 text-white shadow-xl scale-[1.02]" 
                      : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100"
                  )}
                >
                  {s} Shift
                </button>
              ))}
            </div>
          </div>

          <div className="space-y-6">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              2. Select Process
            </label>
            <div className="grid grid-cols-2 gap-3">
              {PROCESSES.map((proc, idx) => {
                const colors = [
                  "bg-blue-600 border-blue-600 shadow-blue-200",
                  "bg-emerald-600 border-emerald-600 shadow-emerald-200",
                  "bg-amber-500 border-amber-500 shadow-amber-200",
                  "bg-red-500 border-red-500 shadow-red-200",
                  "bg-purple-600 border-purple-600 shadow-purple-200",
                  "bg-pink-600 border-pink-600 shadow-pink-200"
                ];
                const selectedColor = colors[idx % colors.length];
                return (
                  <button
                    key={proc}
                    type="button"
                    onClick={() => setFormData({ ...formData, process: proc })}
                    className={cn(
                      "px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center transition-all border-2",
                      formData.process === proc 
                        ? `${selectedColor} text-white shadow-xl scale-[1.02]` 
                        : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    {proc}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-6">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              3. Current Status
            </label>
            <div className="grid grid-cols-3 gap-3">
              {SUB_STATUSES.map((sub, idx) => {
                const colors = [
                  "bg-amber-400 border-amber-400 shadow-amber-100",
                  "bg-blue-500 border-blue-500 shadow-blue-100",
                  "bg-emerald-600 border-emerald-600 shadow-emerald-100"
                ];
                const selectedColor = colors[idx % colors.length];
                return (
                  <button
                    key={sub}
                    type="button"
                    onClick={() => setFormData({ ...formData, subStatus: sub })}
                    className={cn(
                      "px-4 py-4 rounded-2xl text-[10px] font-black uppercase tracking-widest text-center transition-all border-2",
                      formData.subStatus === sub 
                        ? `${selectedColor} text-white shadow-xl scale-[1.02]` 
                        : "bg-slate-50 border-transparent text-slate-500 hover:bg-slate-100"
                    )}
                  >
                    {sub}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              4. Current Area
            </label>
            <div className="relative">
              <MapPin className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <select
                required
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-600/5 appearance-none cursor-pointer text-slate-700"
                value={formData.location}
                onChange={(e) => setFormData({ ...formData, location: e.target.value, machineNo: '' })}
              >
                <option value="">Select Area</option>
                {LOCATIONS.map(loc => <option key={loc} value={loc}>{loc}</option>)}
              </select>
            </div>
          </div>

          {formData.location === 'Wash Machine' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-3"
            >
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                Select Machine No
              </label>
              <div className="relative">
                <Package className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                <select
                  required
                  className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-600/5 appearance-none cursor-pointer text-slate-700"
                  value={formData.machineNo}
                  onChange={(e) => setFormData({ ...formData, machineNo: e.target.value })}
                >
                  <option value="">Select Machine</option>
                  {WASH_MACHINES.map(m => <option key={m} value={m}>{m}</option>)}
                </select>
              </div>
            </motion.div>
          )}

          {formData.process === 'Quality Check' && (
            <motion.div 
              initial={{ opacity: 0, height: 0 }}
              animate={{ opacity: 1, height: 'auto' }}
              className="space-y-6 pt-4 border-t-2 border-dashed border-slate-100"
            >
              <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
                QC Metrics (PCS)
              </label>
              
              <div className="grid grid-cols-1 gap-4">
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Ok Garments Qty</p>
                  <input 
                    type="number"
                    className="w-full px-6 py-4 bg-emerald-50 border border-emerald-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-600/5 text-emerald-700"
                    placeholder="0"
                    value={formData.ok_qty}
                    onChange={(e) => setFormData({ ...formData, ok_qty: e.target.value })}
                  />
                </div>
                
                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Issued Garments</p>
                  <input 
                    type="number"
                    className="w-full px-6 py-4 bg-indigo-50 border border-indigo-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-600/5 text-indigo-700"
                    placeholder="0"
                    value={formData.issued_qty}
                    onChange={(e) => setFormData({ ...formData, issued_qty: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <p className="text-[9px] font-black uppercase tracking-widest text-slate-400 ml-1">Rejected Garments</p>
                  <input 
                    type="number"
                    className="w-full px-6 py-4 bg-red-50 border border-red-100 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-red-600/5 text-red-700"
                    placeholder="0"
                    value={formData.rejected_qty}
                    onChange={(e) => setFormData({ ...formData, rejected_qty: e.target.value })}
                  />
                </div>
              </div>
            </motion.div>
          )}

          <div className="space-y-3">
            <label className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 flex items-center gap-3">
              <div className="w-1.5 h-1.5 rounded-full bg-indigo-600" />
              5. Worker Name / ID
            </label>
            <div className="relative">
              <User className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
              <input 
                type="text"
                required
                className="w-full pl-12 pr-6 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-600/5 text-slate-700 placeholder:text-slate-300"
                placeholder="Enter your name"
                value={formData.worker_name}
                onChange={(e) => setFormData({ ...formData, worker_name: e.target.value })}
              />
            </div>
          </div>

          <button 
            type="submit" 
            disabled={submitting || !formData.process || !formData.subStatus || !formData.location || (formData.location === 'Wash Machine' && !formData.machineNo) || !formData.worker_name}
            className="w-full bg-indigo-600 hover:bg-indigo-700 text-white py-5 rounded-2xl font-black uppercase tracking-[0.2em] text-sm transition-all flex items-center justify-center gap-3 disabled:opacity-30 active:scale-95 shadow-2xl hover:shadow-indigo-500/20"
          >
            {submitting ? (
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Transmitting...
              </div>
            ) : (
              <>
                <Send size={18} />
                Submit Telemetry
              </>
            )}
          </button>
        </form>
      </motion.div>
    </div>
  );
}
