import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { Printer, Download, ArrowLeft, Share2, CheckCircle2, QrCode as QrCodeIcon } from 'lucide-react';
import { Batch } from '../types';

export default function BatchCard() {
  const { id } = useParams();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [loading, setLoading] = useState(true);
  const cardRef = useRef<HTMLDivElement>(null);

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

  const handlePrint = () => {
    window.print();
  };

  const scanUrl = `${window.location.origin}/scan/${id}`;

  if (loading) return <div className="p-12 text-center">Loading batch details...</div>;
  if (!batch) return <div className="p-12 text-center">Batch not found.</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-8 flex items-center justify-between no-print">
        <div className="flex items-center gap-4">
          <Link to="/" className="p-2 hover:bg-black/5 rounded-full transition-colors">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-2xl font-bold tracking-tight">Batch Card Generated</h2>
            <p className="text-sm text-muted-foreground">Unique ID: <span className="font-mono font-bold text-black">{batch.id}</span></p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-4 py-2 bg-white border border-black/10 rounded-xl text-sm font-bold hover:bg-black/5 transition-colors"
          >
            <Printer size={18} />
            Print Card
          </button>
          <button className="flex items-center gap-2 px-4 py-2 bg-emerald-600 text-white rounded-xl text-sm font-bold hover:bg-emerald-700 transition-colors">
            <Download size={18} />
            Export PDF
          </button>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, y: 10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative bg-white border-2 border-black rounded-none overflow-hidden shadow-none print:m-0 print-half-page"
        ref={cardRef}
      >
        {/* Formal Header */}
        <div className="border-b-2 border-black px-8 py-6 flex justify-between items-center">
          <div className="flex items-center gap-6">
            <div className="w-12 h-12 bg-black flex items-center justify-center shrink-0">
              <QrCodeIcon size={32} className="text-white" />
            </div>
            <div>
              <h1 className="text-2xl font-bold uppercase tracking-tight leading-none">
                FAKIR APPARELS LTD.
              </h1>
              <p className="text-sm font-bold uppercase tracking-widest mt-1 text-slate-600">Washing Plant Division</p>
            </div>
          </div>
          
          <div className="text-right border-l-2 border-black pl-8">
            <p className="text-[10px] font-bold uppercase tracking-widest text-slate-400 mb-1">Production Batch ID</p>
            <div className="text-2xl font-mono font-bold tracking-tighter">
              {batch.id}
            </div>
          </div>
        </div>

        {/* Main Information Grid */}
        <div className="p-8 flex flex-row gap-10 relative z-10 h-full">
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-x-10 gap-y-6">
              <FormalDetail label="Buyer / Client" value={batch.buyer} />
              <FormalDetail label="Style Reference" value={batch.style} />
              <FormalDetail label="Color / Shade" value={batch.color} />
              <FormalDetail label="Batch Type" value={batch.batch_type} />
              <FormalDetail label="Total Quantity" value={`${batch.quantity} PCS`} />
              <FormalDetail label="APM Responsible" value={batch.apm_name} />
              <FormalDetail label="Senior Executive" value={batch.senior_executive} />
            </div>

            <div className="mt-8 pt-6 border-t border-black">
              <span className="text-[10px] font-bold uppercase tracking-widest text-slate-400 block mb-2">Processing Instructions</span>
              <p className="text-[12px] leading-snug font-medium text-slate-900 uppercase">
                {batch.special_notes || "Standard washing and drying procedures apply."}
              </p>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="w-44 flex flex-col items-center justify-center gap-4 border-l-2 border-black pl-10">
            <div className="bg-white p-1 border-2 border-black">
              <QRCodeSVG value={scanUrl} size={140} level="H" includeMargin={false} />
            </div>
            
            <div className="text-center space-y-1">
              <p className="text-[9px] font-bold uppercase tracking-widest">Scan for Status</p>
              <p className="text-[7px] font-mono text-slate-400 break-all max-w-[140px]">{scanUrl}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-black text-white px-8 py-3 flex justify-between items-center text-[9px] font-bold uppercase tracking-[0.2em]">
          <div className="flex items-center gap-6">
            <span>Date: {new Date(batch.created_at).toLocaleDateString()}</span>
            <span>System: GPS-V2.1</span>
          </div>
          <span>Official Factory Document - Confidential</span>
        </div>
      </motion.div>

      <div className="mt-8 p-6 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-4 no-print">
        <div className="p-2 bg-emerald-100 rounded-xl text-emerald-600">
          <QrCodeIcon size={24} />
        </div>
        <div>
          <h4 className="font-bold text-emerald-900">Worker Instructions</h4>
          <p className="text-sm text-emerald-700 mt-1">
            Print this card and attach it to the batch bundle. Workers can scan the QR code with any smartphone to update the production status in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}

function FormalDetail({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <span className="text-[9px] font-bold uppercase tracking-widest text-slate-400 block mb-1">{label}</span>
      <span className="text-sm font-bold tracking-tight text-black uppercase">{value}</span>
    </div>
  );
}

function Detail({ label, value }: { label: string, value: string }) {
  return (
    <div>
      <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground block mb-1">{label}</span>
      <span className="text-lg font-bold tracking-tight text-slate-900">{value}</span>
    </div>
  );
}

function QrCode({ size, className }: { size: number, className?: string }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className={className}>
      <rect width="5" height="5" x="3" y="3" rx="1"/><rect width="5" height="5" x="16" y="3" rx="1"/><rect width="5" height="5" x="3" y="16" rx="1"/><path d="M21 16h-3a2 2 0 0 0-2 2v3"/><path d="M21 21v.01"/><path d="M12 7v3a2 2 0 0 1-2 2H7"/><path d="M3 12h.01"/><path d="M12 3h.01"/><path d="M12 16v.01"/><path d="M16 12h1"/><path d="M21 12v.01"/><path d="M12 21v-1"/>
    </svg>
  );
}
