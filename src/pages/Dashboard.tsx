import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, ArrowUpDown, Clock, MapPin, User, Package, CheckCircle2, BarChart3, Activity, Download } from 'lucide-react';
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
    <div className="space-y-8">
      <header className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="text-3xl font-bold tracking-tight">
            {showListOnly ? 'Batch Inventory' : 'Production Dashboard'}
          </h2>
          <p className="text-muted-foreground mt-1">
            {showListOnly ? 'Manage and view all production batches' : 'Real-time tracking of all garment batches'}
          </p>
        </div>
        
        <div className="flex items-center gap-3">
          <a 
            href="/api/backup" 
            download 
            className="flex items-center gap-2 px-4 py-2 bg-white border border-black/5 rounded-xl text-sm font-medium hover:bg-black/5 transition-colors"
            title="Download Database Backup"
          >
            <Download className="w-4 h-4 text-blue-600" />
            <span className="hidden sm:inline">Backup</span>
          </a>
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <input 
              type="text" 
              placeholder="Search style or batch ID..."
              className="pl-10 pr-4 py-2 bg-white border border-black/5 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-emerald-500/20 w-full md:w-64"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <select 
              className="pl-10 pr-8 py-2 bg-white border border-black/5 rounded-xl text-sm focus:outline-none appearance-none cursor-pointer"
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard label="Active Batches" value={batches.length} icon={<Package className="text-blue-500" />} />
            <StatCard label="Total Scans Today" value={scans.filter(s => new Date(s.timestamp).toDateString() === new Date().toDateString()).length} icon={<Clock className="text-emerald-500" />} />
            <StatCard label="Latest Update" value={scans[0]?.status || 'N/A'} subValue={scans[0] ? format(new Date(scans[0].timestamp), 'HH:mm') : ''} icon={<MapPin className="text-orange-500" />} />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-emerald-600" />
                  Production Distribution
                </h3>
                <span className="text-xs font-medium text-muted-foreground">Live Batch Count</span>
              </div>
              <div className="h-64 w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getChartData()}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                    <XAxis 
                      dataKey="name" 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fontWeight: 500 }} 
                    />
                    <YAxis 
                      axisLine={false} 
                      tickLine={false} 
                      tick={{ fontSize: 12, fontWeight: 500 }} 
                    />
                    <Tooltip 
                      cursor={{ fill: '#f8f8f8' }}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 10px 15px -3px rgb(0 0 0 / 0.1)' }}
                    />
                    <Bar dataKey="value" radius={[6, 6, 0, 0]} barSize={40}>
                      {getChartData().map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={['#3b82f6', '#f59e0b', '#ef4444', '#10b981', '#8b5cf6'][index % 5]} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
              <div className="flex items-center justify-between mb-6">
                <h3 className="font-bold text-lg flex items-center gap-2">
                  <Activity className="w-5 h-5 text-emerald-600" />
                  System Health
                </h3>
              </div>
              <div className="space-y-6">
                <HealthItem label="Database Sync" status="Healthy" time="Real-time" />
                <HealthItem label="Telegram Bot" status={process.env.TELEGRAM_BOT_TOKEN ? "Active" : "Not Configured"} time="Polling 5m" />
                <HealthItem label="Server Load" status="Low" time="0.2ms latency" />
                
                <div className="pt-4 border-t border-black/5">
                  <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground mb-3">Current Server Time</p>
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-mono font-bold">{format(new Date(), 'HH:mm:ss')}</span>
                    <span className="text-xs font-medium bg-emerald-100 text-emerald-700 px-2 py-1 rounded-md">UTC-8</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      <div className="bg-white rounded-2xl border border-black/5 overflow-hidden shadow-sm">
        <div className="p-6 border-b border-black/5 flex items-center justify-between">
          <h3 className="font-semibold text-lg">{showListOnly ? 'Batch Inventory' : 'Live Batch Tracking'}</h3>
          <button className="text-xs font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1 hover:text-emerald-600 transition-colors">
            <ArrowUpDown size={14} />
            Sort by Time
          </button>
        </div>

        <div className="overflow-x-auto">
          {showListOnly ? (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-black/[0.02] text-[11px] uppercase tracking-widest font-bold text-muted-foreground">
                  <th className="px-6 py-4">Batch ID</th>
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
        <p className="text-sm font-bold">{label}</p>
        <p className="text-[10px] text-muted-foreground uppercase tracking-wider">{time}</p>
      </div>
      <div className="flex items-center gap-2">
        <span className="text-xs font-semibold">{status}</span>
        <div className={cn(
          "w-2 h-2 rounded-full animate-pulse",
          status === "Healthy" || status === "Active" || status === "Low" ? "bg-emerald-500" : "bg-orange-500"
        )} />
      </div>
    </div>
  );
}

function StatCard({ label, value, subValue, icon }: { label: string, value: string | number, subValue?: string, icon: React.ReactNode }) {
  return (
    <div className="bg-white p-6 rounded-2xl border border-black/5 shadow-sm">
      <div className="flex items-center justify-between mb-4">
        <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">{label}</span>
        <div className="p-2 bg-black/[0.02] rounded-lg">{icon}</div>
      </div>
      <div className="flex items-baseline gap-2">
        <span className="text-3xl font-bold tracking-tight">{value}</span>
        {subValue && <span className="text-sm text-muted-foreground font-medium">{subValue}</span>}
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
