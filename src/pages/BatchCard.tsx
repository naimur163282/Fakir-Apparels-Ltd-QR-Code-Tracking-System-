import React, { useState, useEffect, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { QRCodeSVG } from 'qrcode.react';
import { motion } from 'motion/react';
import { Printer, Download, ArrowLeft, Share2, CheckCircle2, QrCode as QrCodeIcon, Copy, Check } from 'lucide-react';
import { Batch } from '../types';
import { cn } from '../lib/utils';

export default function BatchCard() {
  const { id } = useParams();
  const [batch, setBatch] = useState<Batch | null>(null);
  const [latestScan, setLatestScan] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [copied, setCopied] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchBatch = async () => {
      try {
        const [batchRes, scansRes] = await Promise.all([
          fetch(`/api/batches/${id}`),
          fetch('/api/scans')
        ]);

        if (!batchRes.ok) throw new Error('Batch not found');
        const batchData = await batchRes.json();
        const scansData = await scansRes.json();
        
        setBatch(batchData);
        
        // Find latest scan for this batch
        const batchScans = scansData.filter((s: any) => s.batch_id === id);
        if (batchScans.length > 0) {
          setLatestScan(batchScans[0]); // scans are ordered by timestamp DESC
        }
      } catch (error) {
        console.error('Error fetching batch:', error);
        setBatch(null);
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

  const copyToClipboard = () => {
    navigator.clipboard.writeText(scanUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const downloadQR = () => {
    const svg = document.querySelector('.qr-code-container svg') as SVGElement;
    if (!svg) return;
    const svgData = new XMLSerializer().serializeToString(svg);
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d");
    const img = new Image();
    img.onload = () => {
      canvas.width = img.width;
      canvas.height = img.height;
      ctx?.drawImage(img, 0, 0);
      const pngFile = canvas.toDataURL("image/png");
      const downloadLink = document.createElement("a");
      downloadLink.download = `QR_${batch?.id}.png`;
      downloadLink.href = `${pngFile}`;
      downloadLink.click();
    };
    img.src = "data:image/svg+xml;base64," + btoa(svgData);
  };

  if (loading) return <div className="p-12 text-center">Loading batch details...</div>;
  if (!batch) return <div className="p-12 text-center">Batch not found.</div>;

  return (
    <div className="max-w-4xl mx-auto">
      <header className="mb-10 flex flex-col md:flex-row md:items-center justify-between gap-6 no-print">
        <div className="flex items-center gap-6">
          <Link to="/" className="p-3 bg-white border border-black/5 rounded-2xl hover:bg-black hover:text-white transition-all shadow-sm">
            <ArrowLeft size={20} />
          </Link>
          <div>
            <h2 className="text-3xl font-black tracking-tighter uppercase italic text-slate-900">Batch Card</h2>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest">Production Authorization Document</p>
          </div>
        </div>
        
        <div className="flex items-center gap-3">
          <button 
            onClick={copyToClipboard}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm text-slate-700"
          >
            {copied ? <Check size={16} className="text-emerald-500" /> : <Share2 size={16} />}
            {copied ? 'Copied' : 'Copy Link'}
          </button>
          <button 
            onClick={downloadQR}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm text-slate-700"
          >
            <Download size={16} />
            QR
          </button>
          <button 
            onClick={handlePrint}
            className="flex items-center gap-2 px-5 py-3 bg-white border border-slate-200 rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-600 hover:text-white transition-all shadow-sm text-slate-700"
          >
            <Printer size={16} />
            Print
          </button>
          <button className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-2xl text-xs font-bold uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl">
            <Download size={16} />
            Export
          </button>
        </div>
      </header>

      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="relative bg-white border-[3px] border-slate-900 rounded-none overflow-hidden shadow-[0_40px_80px_-20px_rgba(0,0,0,0.15)] print:m-0 print-half-page"
        ref={cardRef}
      >
        {/* Technical Grid Pattern Overlay */}
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none" style={{ backgroundImage: 'radial-gradient(#000 1px, transparent 1px)', backgroundSize: '20px 20px' }} />
        
        {/* Formal Header */}
        <div className="border-b-[3px] border-slate-900 px-10 py-8 flex justify-between items-center bg-white relative z-10">
          <div className="flex items-center gap-8">
            <div className="w-16 h-16 bg-slate-900 flex items-center justify-center shrink-0">
              <QrCodeIcon size={40} className="text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-black uppercase tracking-tighter leading-none italic text-slate-900">
                FAKIR APPARELS LTD.
              </h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-indigo-600">Washing Plant</span>
                <div className="w-1 h-1 rounded-full bg-slate-200" />
                <span className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400">Production Unit-04</span>
              </div>
            </div>
          </div>
          
          <div className="text-right border-l-[3px] border-slate-900 pl-10 h-16 flex flex-col justify-center">
            <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mb-1">Batch Serial</p>
            <div className="text-3xl font-mono font-black tracking-tighter text-indigo-600">
              {batch.id}
            </div>
          </div>
        </div>

        {/* Main Information Grid */}
        <div className="p-10 flex flex-row gap-12 relative z-10">
          <div className="flex-1">
            <div className="grid grid-cols-2 gap-x-12 gap-y-8">
              <FormalDetail label="Buyer / Client" value={batch.buyer} />
              <FormalDetail label="Style Reference" value={batch.style} />
              <FormalDetail label="Color / Shade" value={batch.color} />
              <FormalDetail label="Batch Type" value={batch.batch_type} />
              <FormalDetail label="Total Quantity" value={`${batch.quantity} PCS`} />
              <FormalDetail label="APM Responsible" value={batch.apm_name} />
              <FormalDetail label="Senior Executive" value={batch.senior_executive} />
              <FormalDetail label="Operator Name" value={latestScan?.worker_name || "________________"} />
              <FormalDetail label="Machine No." value={latestScan?.machine_no || "________________"} />
              <FormalDetail label="Authorization" value="VERIFIED" isStatus />
            </div>

            {latestScan && (latestScan.ok_qty > 0 || latestScan.rejected_qty > 0) && (
              <div className="mt-8 p-6 border-[3px] border-slate-900 bg-slate-50">
                <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-4">Latest Quality Check Results</span>
                <div className="grid grid-cols-3 gap-6">
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">OK Qty</span>
                    <span className="text-lg font-black text-emerald-600">{latestScan.ok_qty} PCS</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Issued</span>
                    <span className="text-lg font-black text-indigo-600">{latestScan.issued_qty} PCS</span>
                  </div>
                  <div>
                    <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 block mb-1">Rejected</span>
                    <span className="text-lg font-black text-red-600">{latestScan.rejected_qty} PCS</span>
                  </div>
                </div>
              </div>
            )}

            <div className="mt-10 pt-8 border-t-[3px] border-slate-900">
              <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-3">Technical Processing Notes</span>
              <div className="bg-slate-50 p-4 border border-slate-200 rounded-lg">
                <p className="text-[13px] leading-relaxed font-bold text-slate-900 uppercase italic">
                  {batch.special_notes || "Standard industrial washing and high-temperature drying procedures apply. Maintain quality standards as per buyer manual."}
                </p>
              </div>
            </div>
          </div>

          {/* QR Code Section */}
          <div className="w-56 flex flex-col items-center justify-center gap-6 border-l-[3px] border-slate-900 pl-12">
            <div className="qr-code-container bg-white p-4 border-[3px] border-slate-900 shadow-[8px_8px_0_0_rgba(79,70,229,1)]">
              <QRCodeSVG 
                value={scanUrl} 
                size={160} 
                level="H" 
                includeMargin={true}
              />
            </div>
            
            <div className="text-center space-y-2">
              <div className="inline-block px-2 py-1 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest mb-1">
                Scan to Update
              </div>
              <p className="text-[8px] font-mono text-slate-400 break-all max-w-[160px] leading-tight">{scanUrl}</p>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="bg-slate-900 text-white px-10 py-4 flex justify-between items-center text-[10px] font-black uppercase tracking-[0.3em]">
          <div className="flex items-center gap-8">
            <span className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Issued: {new Date(batch.created_at).toLocaleDateString()}
            </span>
            <span>System: GPS-V2.5-PRO</span>
          </div>
          <span className="opacity-50 italic">Official Production Document</span>
        </div>
      </motion.div>

      <div className="mt-8 p-6 bg-indigo-50 rounded-2xl border border-indigo-100 flex items-start gap-4 no-print">
        <div className="p-2 bg-indigo-100 text-indigo-600 rounded-xl">
          <QrCodeIcon size={24} />
        </div>
        <div>
          <h4 className="font-bold text-indigo-900">Worker Instructions</h4>
          <p className="text-sm text-indigo-700 mt-1">
            Print this card and attach it to the batch bundle. Workers can scan the QR code with any smartphone to update the production status in real-time.
          </p>
        </div>
      </div>
    </div>
  );
}

function FormalDetail({ label, value, isStatus = false }: { label: string, value: string, isStatus?: boolean }) {
  return (
    <div>
      <span className="text-[10px] font-black uppercase tracking-widest text-slate-400 block mb-1.5">{label}</span>
      <span className={cn(
        "text-sm font-black tracking-tight uppercase",
        isStatus ? "text-indigo-600" : "text-slate-900"
      )}>
        {value}
      </span>
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
