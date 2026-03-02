import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Save, User, Tag, Palette, Briefcase, Users, Hash, FileText, AlertCircle, Sparkles } from 'lucide-react';

export default function CreateBatch() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    buyer: '',
    style: '',
    color: '',
    apm_name: '',
    senior_executive: '',
    quantity: '',
    batch_type: 'Bulk',
    special_notes: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const batchId = `BT-${Math.random().toString(36).substring(2, 8).toUpperCase()}`;
    
    try {
      const response = await fetch('/api/batches', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          id: batchId,
          ...formData,
          quantity: parseInt(formData.quantity)
        })
      });

      if (response.ok) {
        navigate(`/batch/${batchId}`);
      } else {
        const errData = await response.json();
        setError(errData.error || 'Failed to generate batch. Please try again.');
      }
    } catch (error) {
      console.error('Error creating batch:', error);
      setError('Network error. Please check your connection.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto py-8">
      <header className="mb-10 text-center">
        <motion.div
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-50 text-indigo-600 text-[10px] font-bold uppercase tracking-widest mb-4 border border-indigo-100"
        >
          <Sparkles size={12} />
          Production Control
        </motion.div>
        <h2 className="text-5xl font-black tracking-tighter uppercase italic text-slate-900">Create New Batch</h2>
        <p className="text-slate-500 mt-2 font-medium">Initialize garment production tracking with high-precision QR generation.</p>
      </header>

      {error && (
        <motion.div 
          initial={{ opacity: 0, x: -20 }}
          animate={{ opacity: 1, x: 0 }}
          className="mb-6 p-4 bg-red-50 border border-red-100 rounded-2xl flex items-center gap-3 text-red-600 text-sm font-bold"
        >
          <AlertCircle size={20} />
          {error}
        </motion.div>
      )}

      <motion.div 
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-[2.5rem] border border-slate-200 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.05)] overflow-hidden"
      >
        <div className="absolute top-0 left-0 w-full h-2 bg-gradient-to-r from-indigo-500 via-emerald-500 to-amber-500" />
        
        <form onSubmit={handleSubmit} className="p-10 md:p-16 space-y-10 relative">
          <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-32 -mt-32 opacity-50 blur-3xl pointer-events-none" />
          <div className="absolute bottom-0 left-0 w-64 h-64 bg-emerald-50 rounded-full -ml-32 -mb-32 opacity-50 blur-3xl pointer-events-none" />
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-8 relative z-10">
            <InputGroup 
              label="Buyer Name" 
              icon={<User size={18} />}
              value={formData.buyer}
              onChange={(v) => setFormData({ ...formData, buyer: v })}
              placeholder="e.g. Zara, H&M"
              required
            />
            <InputGroup 
              label="Style Number" 
              icon={<Tag size={18} />}
              value={formData.style}
              onChange={(v) => setFormData({ ...formData, style: v })}
              placeholder="e.g. SS24-DR-001"
              required
            />
            <InputGroup 
              label="Color" 
              icon={<Palette size={18} />}
              value={formData.color}
              onChange={(v) => setFormData({ ...formData, color: v })}
              placeholder="e.g. Midnight Blue"
              required
            />
            <InputGroup 
              label="APM Name" 
              icon={<Briefcase size={18} />}
              value={formData.apm_name}
              onChange={(v) => setFormData({ ...formData, apm_name: v })}
              placeholder="Assistant Product Manager"
              required
            />
            <InputGroup 
              label="Senior Executive" 
              icon={<Users size={18} />}
              value={formData.senior_executive}
              onChange={(v) => setFormData({ ...formData, senior_executive: v })}
              placeholder="Approving Authority"
              required
            />
            <InputGroup 
              label="Garment Quantity" 
              icon={<Hash size={18} />}
              type="number"
              value={formData.quantity}
              onChange={(v) => setFormData({ ...formData, quantity: v })}
              placeholder="Total pieces"
              required
            />
            <div className="space-y-2">
              <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
                <Tag size={18} />
                Batch Type
              </label>
              <select 
                className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 appearance-none cursor-pointer text-slate-700"
                value={formData.batch_type}
                onChange={(e) => setFormData({ ...formData, batch_type: e.target.value })}
                required
              >
                <option value="Bulk">Bulk Production</option>
                <option value="Sample">Sample / Proto</option>
                <option value="Mockup">Mockup / Trial</option>
                <option value="Re-wash">Re-wash / Repair</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold uppercase tracking-widest text-slate-400 flex items-center gap-2">
              <FileText size={14} />
              Special Notes
            </label>
            <textarea 
              className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-indigo-500/20 min-h-[120px] text-slate-700"
              placeholder="Add any specific instructions or quality requirements..."
              value={formData.special_notes}
              onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
            />
          </div>

          <div className="pt-8 flex flex-col md:flex-row items-center justify-between gap-6 border-t border-slate-100">
            <div className="text-xs text-slate-400 font-medium max-w-xs">
              By generating this batch, you are authorizing the production start and initializing real-time tracking across all departments.
            </div>
            <button 
              type="submit" 
              disabled={loading}
              className="w-full md:w-auto bg-indigo-600 hover:bg-indigo-700 text-white px-12 py-5 rounded-2xl font-black uppercase tracking-widest transition-all flex items-center justify-center gap-3 disabled:opacity-50 shadow-[0_20px_40px_-10px_rgba(79,70,229,0.4)] hover:shadow-indigo-500/60 active:scale-95 group"
            >
              {loading ? (
                <div className="flex items-center gap-2">
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Processing...
                </div>
              ) : (
                <>
                  <Save size={20} className="group-hover:rotate-12 transition-transform" />
                  Generate Batch Card
                </>
              )}
            </button>
          </div>
        </form>
      </motion.div>
    </div>
  );
}

function InputGroup({ label, icon, value, onChange, placeholder, type = "text", required = false }: any) {
  return (
    <div className="space-y-2 group">
      <label className="text-xs font-black uppercase tracking-widest text-slate-400 flex items-center gap-2 group-focus-within:text-indigo-600 transition-colors">
        <div className="p-1.5 bg-slate-50 rounded-lg group-focus-within:bg-indigo-50 group-focus-within:text-indigo-600 transition-colors">
          {icon}
        </div>
        {label}
      </label>
      <input 
        type={type}
        required={required}
        className="w-full px-5 py-4 bg-slate-50 border-2 border-transparent rounded-2xl text-sm font-bold focus:outline-none focus:bg-white focus:border-indigo-600/20 focus:ring-4 focus:ring-indigo-500/5 text-slate-700 placeholder:text-slate-300 transition-all"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
