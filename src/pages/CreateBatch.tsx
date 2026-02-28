import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'motion/react';
import { Save, User, Tag, Palette, Briefcase, Users, Hash, FileText } from 'lucide-react';

export default function CreateBatch() {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
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
      }
    } catch (error) {
      console.error('Error creating batch:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto">
      <header className="mb-8">
        <h2 className="text-3xl font-bold tracking-tight">Create New Batch</h2>
        <p className="text-muted-foreground mt-1">Enter garment production details to generate a tracking QR code.</p>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white rounded-2xl border border-black/5 shadow-sm overflow-hidden"
      >
        <form onSubmit={handleSubmit} className="p-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
              <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
                <Tag size={18} />
                Batch Type
              </label>
              <select 
                className="w-full px-4 py-3 bg-black/[0.02] border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 appearance-none cursor-pointer"
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
            <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
              <FileText size={14} />
              Special Notes
            </label>
            <textarea 
              className="w-full px-4 py-3 bg-black/[0.02] border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 min-h-[120px]"
              placeholder="Add any specific instructions or quality requirements..."
              value={formData.special_notes}
              onChange={(e) => setFormData({ ...formData, special_notes: e.target.value })}
            />
          </div>

          <div className="pt-4 flex justify-end">
            <button 
              type="submit" 
              disabled={loading}
              className="bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-3 rounded-xl font-bold transition-all flex items-center gap-2 disabled:opacity-50"
            >
              {loading ? 'Generating...' : (
                <>
                  <Save size={20} />
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
    <div className="space-y-2">
      <label className="text-xs font-bold uppercase tracking-widest text-muted-foreground flex items-center gap-2">
        {icon}
        {label}
      </label>
      <input 
        type={type}
        required={required}
        className="w-full px-4 py-3 bg-black/[0.02] border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20"
        placeholder={placeholder}
        value={value}
        onChange={(e) => onChange(e.target.value)}
      />
    </div>
  );
}
