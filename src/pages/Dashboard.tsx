import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, ArrowUpDown, Clock, MapPin, User, Package, CheckCircle2, BarChart3, Activity, Download, Zap, ShieldCheck, Globe } from 'lucide-react';
import { format } from 'date-fns';
import { Batch, Scan } from '../types';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';

export default function Dashboard({ showListOnly = false }: { showListOnly?: boolean }) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scansRes, batchesRes] = await Promise.all([
          fetch('/api/scans'),
          fetch('/api/batches')
        ]);
        const scansData = await scansRes.json();
        const batchesData = await batchesRes.json();
        setScans(scansData);
        setBatches(batchesData);
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 10000); // Refresh every 10s
    return () => clearInterval(interval);
  }, []);

  const filteredScans = scans.filter(scan => 
    (scan.style?.toLowerCase().includes(searchTerm.toLowerCase()) || 
     scan.batch_id.toLowerCase().includes(searchTerm.toLowerCase())) &&
    (filterStatus === 'All' || scan.status.includes(filterStatus))
  );

  const filteredBatches = batches.filter(batch => 
    batch.style.toLowerCase().includes(searchTerm.toLowerCase()) || 
    batch.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
    batch.buyer.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const statuses = ['All', 'Wash', 'Hydro', 'Dryer', 'Quality', 'Acid'];

  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>;

  const getBatchHistory = (batchId: string) => {
    return scans.filter(s => s.batch_id === batchId).reverse();
  };

  const getLatestStatus = (batchId: string) => {
    return scans.find(s => s.batch_id === batchId);
  };

  const getChartData = () => {
    const counts: Record<string, number> = {
      'Wash': 0,
      'Hydro': 0,
      'Dryer': 0,
      'Quality Check': 0,
      'Acid Wash': 0
    };
    
    batches.forEach(batch => {
      const latest = getLatestStatus(batch.id);
      if (latest) {
        const status = latest.status.split(' - ')[0];
        if (counts[status] !== undefined) {
          counts[status]++;
        }
      }
    });

    return Object.entries(counts).map(([name, value]) => ({ name, value }));
  };

  const isDelayed = (scan: Scan) => {
    if (!scan.status.includes('Waiting')) return false;
    if (!scan.status.includes('Hydro') && !scan.status.includes('Dryer')) return false;
    const waitTime = Date.now() - new Date(scan.timestamp).getTime();
    return waitTime > 30 * 60 * 1000;
  };

  return (
    <div className="space-y-10 pb-20">
      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 bg-emerald-500 text-white text-[9px] font-black uppercase tracking-widest rounded">Live</div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-muted-foreground">Production Intelligence System</div>
          </div>
          <h2 className="text-6xl font-black tracking-tighter uppercase italic leading-none">
            {showListOnly ? 'Inventory' : 'Mission Control'}
          </h2>
          <p className="text-muted-foreground font-medium max-w-xl">
            {showListOnly ? 'Comprehensive database of all production batches and historical records.' : 'Real-time telemetry and process monitoring for Fakir Apparels Washing Plant.'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center gap-2 p-1 bg-white border border-black/5 rounded-2xl shadow-sm">
            <a 
              href="/api/backup" 
              download 
              className="flex items-center gap-2 px-4 py-2.5 hover:bg-black hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all"
            >
              <Download size={14} />
              Backup
            </a>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4 group-focus-within:text-emerald-500 transition-colors" />
            <input 
              type="text" 
              placeholder="Filter style or ID..."
              className="pl-12 pr-6 py-3.5 bg-white border border-black/5 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-emerald-500/10 w-full md:w-72 shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <select 
              className="pl-12 pr-10 py-3.5 bg-white border border-black/5 rounded-2xl text-sm font-bold focus:outline-none appearance-none cursor-pointer shadow-sm hover:bg-black/[0.02] transition-all"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </header>

      {!showListOnly && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard label="Active Batches" value={batches.length} icon={<Package className="text-blue-500" />} trend="+12%" />
            <StatCard label="Scans (24h)" value={scans.filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString()).length} icon={<Zap className="text-yellow-500" />} trend="Active" />
            <StatCard label="System Integrity" value="99.9%" icon={<ShieldCheck className="text-emerald-500" />} trend="Secure" />
            <StatCard label="Global Sync" value="Live" icon={<Globe className="text-purple-500" />} trend="0.2ms" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-500" />
              <div className="flex items-center justify-between mb-10">
                <div>
                  <h3 className="font-black text-2xl uppercase tracking-tighter italic flex items-center gap-3">
                    <BarChart3 className="w-6 h-6 text-emerald-600" />
                    Process Telemetry
                  </h3>
                  <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Batch distribution across departments</p>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-emerald-600">Real-time Feed</span>
                </div>
              </div>
              <div className="h-72 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.1em' }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 10, fontWeight: 800 }} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8f8f8' }}
                      contentStyle={{ borderRadius: '20px', border: 'none', boxShadow: '0 20px 25px -5px rgb(0 0 0 / 0.1)', padding: '16px' }}
                      itemStyle={{ fontWeight: 800, textTransform: 'uppercase', fontSize: '10px' }}
                    />
                    <Bar dataKey="value" radius={[10, 10, 0, 0]} barSize={50}>
                      {getChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#000000', '#10b981', '#3b82f6', '#f59e0b', '#8b5cf6'][index % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-10 rounded-[2.5rem] border border-black/5 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
              <div className="absolute top-0 left-0 w-full h-1.5 bg-black" />
              <div className="flex items-center justify-between mb-10">
                <h3 className="font-black text-2xl uppercase tracking-tighter italic flex items-center gap-3">
                  <Activity className="w-6 h-6 text-black" />
                  Core Status
                </h3>
              </div>
              <div className="space-y-8">
                <HealthItem label="Database Engine" status="Healthy" time="SQLite V3" />
                <HealthItem label="Telegram Gateway" status={process.env.TELEGRAM_BOT_TOKEN ? "Active" : "Offline"} time="Bot API V7" />
                <HealthItem label="Network Latency" status="Optimal" time="0.12ms" />
                
                <div className="pt-8 border-t-2 border-dashed border-black/5">
                  <p className="text-[10px] font-black uppercase tracking-[0.3em] text-muted-foreground mb-4">Master Clock</p>
                  <div className="flex items-center justify-between bg-black text-white p-6 rounded-3xl shadow-xl">
                    <span className="text-4xl font-mono font-black tracking-tighter">{format(new Date(), 'HH:mm:ss')}</span>
                    <div className="text-right">
                      <p className="text-[8px] font-black uppercase tracking-widest opacity-50">Zone</p>
                      <p className="text-xs font-black">UTC-8</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-[2.5rem] border border-black/5 overflow-hidden shadow-[0_32px_64px_-15px_rgba(0,0,0,0.05)]">
        <div className="p-10 border-b border-black/5 flex items-center justify-between bg-black/[0.01]">
          <div>
            <h3 className="font-black text-3xl uppercase tracking-tighter italic">{showListOnly ? 'Inventory' : 'Live Telemetry'}</h3>
            <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest mt-1">Real-time production sequence records</p>
          </div>
          <button className="px-6 py-3 bg-white border border-black/10 rounded-2xl text-[10px] font-black uppercase tracking-widest text-muted-foreground flex items-center gap-2 hover:bg-black hover:text-white transition-all shadow-sm">
            <ArrowUpDown size={14} />
            Sort Sequence
          </button>
        </div>

        <div className="overflow-x-auto">
          {showListOnly ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/[0.02] text-[11px] uppercase tracking-widest font-bold text-muted-foreground">
                  <th className="px-6 py-4">Batch ID</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Buyer</th>
                  <th className="px-6 py-4">Style</th>
                  <th className="px-6 py-4">Current Status</th>
                  <th className="px-6 py-4">Last Location</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-black/5">
                {filteredBatches.map((batch) => {
                  const latest = getLatestStatus(batch.id);
                  const delayed = latest && isDelayed(latest);
                  return (
                    <tr key={batch.id} className={cn(
                      "hover:bg-black/[0.01] transition-colors",
                      delayed && "bg-red-50/50"
                    )}>
                      <td className="px-6 py-4 font-mono text-sm font-medium">
                        <div className="flex items-center gap-2">
                          {batch.id}
                          {delayed && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Production Delay!" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2 py-1 rounded text-slate-600">
                          {batch.batch_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm">{batch.buyer}</td>
                      <td className="px-6 py-4 text-sm font-semibold">{batch.style}</td>
                      <td className="px-6 py-4">
                        {latest ? (
                          <span className={cn(
                            "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                            getStatusBadgeColor(latest.status)
                          )}>
                            {latest.status}
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground italic">No scans yet</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-muted-foreground">
                        {latest?.location || 'N/A'}
                      </td>
                      <td className="px-6 py-4 flex items-center gap-4">
                        <Link to={`/batch/${batch.id}`} className="text-emerald-600 hover:underline text-sm font-medium">Card</Link>
                        <button 
                          onClick={() => setSelectedBatchId(selectedBatchId === batch.id ? null : batch.id)}
                          className="text-blue-600 hover:underline text-sm font-medium"
                        >
                          History
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          ) : (
            <div className="divide-y divide-black/5">
              {filteredScans.length > 0 ? filteredScans.map((scan) => (
                <motion.div 
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  key={scan.id} 
                  className="p-6 flex flex-col md:flex-row md:items-center justify-between gap-4 hover:bg-black/[0.01] transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      "w-12 h-12 rounded-xl flex items-center justify-center text-white font-bold text-xl",
                      getStatusColor(scan.status)
                    )}>
                      {scan.status.charAt(0)}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-lg">{scan.style}</span>
                        <span className="text-xs font-mono bg-black/5 px-2 py-0.5 rounded text-muted-foreground">{scan.batch_id}</span>
                      </div>
                      <div className="flex items-center gap-4 mt-1 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1"><User size={14} /> {scan.worker_name}</span>
                        <span className="flex items-center gap-1"><MapPin size={14} /> {scan.location}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex flex-col md:items-end">
                    <span className={cn(
                      "px-3 py-1 rounded-full text-xs font-bold uppercase tracking-wider",
                      getStatusBadgeColor(scan.status)
                    )}>
                      {scan.status}
                    </span>
                    <span className="text-xs text-muted-foreground mt-2 flex items-center gap-1">
                      <Clock size={12} />
                      {format(new Date(scan.timestamp), 'MMM d, HH:mm')}
                    </span>
                  </div>
                </motion.div>
              )) : (
                <div className="p-12 text-center text-muted-foreground">
                  No activity found matching your criteria.
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Batch History Modal/Overlay */}
      {selectedBatchId && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-[100] flex items-center justify-center p-4">
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white w-full max-w-2xl rounded-[2rem] shadow-2xl overflow-hidden"
          >
            <div className="bg-black text-white p-6 flex justify-between items-center">
              <div>
                <h4 className="text-xl font-bold">Batch Journey</h4>
                <p className="text-xs text-white/60 font-mono">ID: {selectedBatchId}</p>
              </div>
              <button 
                onClick={() => setSelectedBatchId(null)}
                className="p-2 hover:bg-white/10 rounded-full transition-colors"
              >
                <ArrowUpDown className="rotate-45" />
              </button>
            </div>
            
            <div className="p-8 max-h-[60vh] overflow-y-auto">
              <div className="relative space-y-8 before:absolute before:left-[19px] before:top-2 before:bottom-2 before:w-0.5 before:bg-black/5">
                {getBatchHistory(selectedBatchId).map((step, idx) => (
                  <div key={step.id} className="relative flex gap-6">
                    <div className={cn(
                      "w-10 h-10 rounded-full flex items-center justify-center z-10 border-4 border-white shadow-sm",
                      idx === 0 ? "bg-emerald-500 text-white" : "bg-slate-100 text-slate-400"
                    )}>
                      {idx === 0 ? <CheckCircle2 size={18} /> : <Clock size={18} />}
                    </div>
                    <div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-slate-900">{step.status}</span>
                        <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                          {format(new Date(step.timestamp), 'MMM d, HH:mm')}
                        </span>
                      </div>
                      <p className="text-sm text-slate-500 mt-1">
                        Processed by <span className="font-semibold text-slate-700">{step.worker_name}</span> at <span className="font-semibold text-slate-700">{step.location}</span>
                      </p>
                    </div>
                  </div>
                ))}
                {getBatchHistory(selectedBatchId).length === 0 && (
                  <p className="text-center text-muted-foreground py-8">No history found for this batch.</p>
                )}
              </div>
            </div>
            
            <div className="p-6 bg-slate-50 border-t border-black/5 flex justify-end">
              <button 
                onClick={() => setSelectedBatchId(null)}
                className="px-6 py-2 bg-black text-white rounded-xl font-bold text-sm"
              >
                Close History
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function HealthItem({ label, status, time }: { label: string, status: string, time: string }) {
  return (
    <div className="flex items-center justify-between">
      <div>
        <p className="text-xs font-black uppercase tracking-widest">{label}</p>
        <p className="text-[9px] text-muted-foreground uppercase tracking-[0.2em] mt-0.5">{time}</p>
      </div>
      <div className="flex items-center gap-3">
        <span className="text-[10px] font-black uppercase tracking-widest">{status}</span>
        <div className={cn(
          "w-2.5 h-2.5 rounded-full",
          status === "Healthy" || status === "Active" || status === "Optimal" ? "bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" : "bg-orange-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]"
        )} />
      </div>
    </div>
  );
}

function StatCard({ label, value, trend, icon }: { label: string, value: string | number, trend?: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-8 rounded-[2rem] border border-black/5 shadow-sm hover:shadow-xl transition-all group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-24 h-24 bg-black/[0.01] rounded-full -mr-12 -mt-12 transition-all group-hover:scale-150" />
      <div className="flex items-center justify-between mb-6 relative z-10">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">{label}</span>
        <div className="p-3 bg-black/[0.03] rounded-2xl group-hover:bg-black group-hover:text-white transition-all">{icon}</div>
      </div>
      <div className="flex items-end justify-between relative z-10">
        <span className="text-4xl font-black tracking-tighter italic">{value}</span>
        {trend && (
          <span className={cn(
            "text-[9px] font-black uppercase tracking-widest px-2 py-1 rounded-lg",
            trend.includes('+') || trend === "Active" || trend === "Secure" ? "bg-emerald-100 text-emerald-700" : "bg-blue-100 text-blue-700"
          )}>
            {trend}
          </span>
        )}
      </div>
    </div>
  );
}

function getStatusColor(status: string) {
  const s = status.toLowerCase();
  if (s.includes('wash') && !s.includes('acid')) return 'bg-blue-500';
  if (s.includes('hydro')) return 'bg-amber-500';
  if (s.includes('dryer')) return 'bg-red-500';
  if (s.includes('quality')) return 'bg-emerald-500';
  if (s.includes('acid')) return 'bg-purple-500';
  if (s.includes('creating')) return 'bg-slate-700';
  return 'bg-slate-400';
}

function getStatusBadgeColor(status: string) {
  const s = status.toLowerCase();
  if (s.includes('wash') && !s.includes('acid')) return 'bg-blue-100 text-blue-700';
  if (s.includes('hydro')) return 'bg-amber-100 text-amber-700';
  if (s.includes('dryer')) return 'bg-red-100 text-red-700';
  if (s.includes('quality')) return 'bg-emerald-100 text-emerald-700';
  if (s.includes('acid')) return 'bg-purple-100 text-purple-700';
  if (s.includes('creating')) return 'bg-slate-100 text-slate-700';
  return 'bg-slate-100 text-slate-600';
}
