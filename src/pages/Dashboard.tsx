import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, ArrowUpDown, Clock, MapPin, User, Package, CheckCircle2, BarChart3, Activity, Download, Zap, ShieldCheck, Globe, Table as TableIcon, List, LayoutGrid, AlertTriangle } from 'lucide-react';
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
  const [viewMode, setViewMode] = useState<'telemetry' | 'grid' | 'inventory'>('telemetry');
  const [uptime, setUptime] = useState('00:00:00');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedShift, setSelectedShift] = useState<'All' | 'Day' | 'Night'>('All');

  useEffect(() => {
    const startTime = Date.now();
    const timer = setInterval(() => {
      const diff = Date.now() - startTime;
      const h = Math.floor(diff / 3600000).toString().padStart(2, '0');
      const m = Math.floor((diff % 3600000) / 60000).toString().padStart(2, '0');
      const s = Math.floor((diff % 60000) / 1000).toString().padStart(2, '0');
      setUptime(`${h}:${m}:${s}`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    if (showListOnly) setViewMode('inventory');
  }, [showListOnly]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [scansRes, batchesRes] = await Promise.all([
          fetch('/api/scans'),
          fetch('/api/batches')
        ]);
        
        if (!scansRes.ok || !batchesRes.ok) {
          throw new Error('Failed to fetch data from server');
        }

        const scansData = await scansRes.json();
        const batchesData = await batchesRes.json();
        
        setScans(Array.isArray(scansData) ? scansData : []);
        setBatches(Array.isArray(batchesData) ? batchesData : []);
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

  const filteredScans = scans.filter(scan => {
    const scanDate = format(new Date(scan.timestamp), 'yyyy-MM-dd');
    const matchesDate = scanDate === selectedDate;
    const matchesShift = selectedShift === 'All' || scan.shift === selectedShift;
    const matchesSearch = (scan.style?.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          scan.batch_id.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesStatus = (filterStatus === 'All' || scan.status.includes(filterStatus));
    
    return matchesDate && matchesShift && matchesSearch && matchesStatus;
  });

  const filteredBatches = batches.filter(batch => {
    const matchesSearch = batch.style.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          batch.id.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          batch.buyer.toLowerCase().includes(searchTerm.toLowerCase());
    
    // Only show batches that have scans in the selected date/shift if not in inventory mode
    if (viewMode !== 'inventory') {
      const hasScans = scans.some(s => 
        s.batch_id === batch.id && 
        format(new Date(s.timestamp), 'yyyy-MM-dd') === selectedDate &&
        (selectedShift === 'All' || s.shift === selectedShift)
      );
      return matchesSearch && hasScans;
    }
    
    return matchesSearch;
  });

  const statuses = ['All', 'Wash', 'Hydro', 'Dryer', 'Quality', 'Acid'];

  if (loading) return <div className="flex items-center justify-center h-full">Loading...</div>;

  const getBatchHistory = (batchId: string) => {
    return scans.filter(s => s.batch_id === batchId).reverse();
  };

  const getLatestStatus = (batchId: string) => {
    return scans.find(s => s.batch_id === batchId);
  };

  const getProcessStatus = (batchId: string, processName: string) => {
    const batchScans = scans.filter(s => s.batch_id === batchId && s.status.includes(processName));
    if (batchScans.length === 0) return null;
    // Sort by timestamp to get the latest for this specific process
    return batchScans.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())[0];
  };

  const PROCESS_STEPS = [
    { id: 'Wash', label: 'Washing' },
    { id: 'Hydro', label: 'Hydro' },
    { id: 'Dryer', label: 'Drying' },
    { id: 'Quality', label: 'Quality' },
    { id: 'Acid', label: 'Acid Wash' }
  ];

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

  const getWeeklyTrendData = () => {
    const last7Days = Array.from({ length: 7 }, (_, i) => {
      const d = new Date();
      d.setDate(d.getDate() - i);
      return format(d, 'yyyy-MM-dd');
    }).reverse();

    return last7Days.map(date => {
      const dayScans = scans.filter(s => 
        format(new Date(s.timestamp), 'yyyy-MM-dd') === date &&
        s.status.includes('Quality Check') && 
        s.status.includes('End')
      );
      const totalOk = dayScans.reduce((acc, s) => acc + (s.ok_qty || 0), 0);
      return {
        date: format(new Date(date), 'MMM dd'),
        output: totalOk
      };
    });
  };

  const getWorkerLeaderboard = () => {
    const workerStats: Record<string, { count: number, ok: number }> = {};
    
    scans.forEach(scan => {
      if (!workerStats[scan.worker_name]) {
        workerStats[scan.worker_name] = { count: 0, ok: 0 };
      }
      workerStats[scan.worker_name].count++;
      workerStats[scan.worker_name].ok += (scan.ok_qty || 0);
    });

    return Object.entries(workerStats)
      .map(([name, stats]) => ({ name, ...stats }))
      .sort((a, b) => b.ok - a.ok)
      .slice(0, 5);
  };

  const isDelayed = (scan: Scan) => {
    if (!scan.status.includes('Waiting')) return false;
    if (!scan.status.includes('Hydro') && !scan.status.includes('Dryer')) return false;
    const waitTime = Date.now() - new Date(scan.timestamp).getTime();
    return waitTime > 30 * 60 * 1000;
  };

  const downloadCSV = () => {
    const headers = ['Batch ID', 'Style', 'Buyer', ...PROCESS_STEPS.map(s => s.label), 'Final Status'];
    const rows = filteredBatches.map(batch => {
      const processData = PROCESS_STEPS.map(step => {
        const status = getProcessStatus(batch.id, step.id);
        return status ? `${status.status} (${format(new Date(status.timestamp), 'HH:mm')})` : 'N/A';
      });
      const finalStatus = getLatestStatus(batch.id)?.status.includes('End') ? 'Completed' : 'In Progress';
      return [batch.id, batch.style, batch.buyer, ...processData, finalStatus];
    });

    const csvContent = [headers, ...rows].map(e => e.join(",")).join("\n");
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `production_report_${format(new Date(), 'yyyy-MM-dd')}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-10 pb-20">
      {/* Global Stats Bar */}
      <div className="bg-slate-900 -mx-4 sm:-mx-8 px-4 sm:px-8 py-3 flex items-center gap-8 overflow-x-auto no-scrollbar border-b border-white/5">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">System Online</span>
        </div>
        <div className="h-4 w-[1px] bg-white/10 shrink-0" />
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Selected Output:</span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest">
              {filteredScans
                .filter(s => s.status.includes('Quality Check') && s.status.includes('End'))
                .reduce((acc, s) => acc + (s.ok_qty || 0), 0)
                .toLocaleString()} PCS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Shift:</span>
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest">{selectedShift}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Date:</span>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest">{selectedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Uptime:</span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest font-mono">{uptime}</span>
          </div>
        </div>
        <div className="ml-auto flex items-center gap-4 shrink-0">
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest font-mono">{format(new Date(), 'yyyy.MM.dd | HH:mm:ss')}</span>
        </div>
      </div>

      <header className="flex flex-col xl:flex-row xl:items-end justify-between gap-8">
        <div className="space-y-2">
          <div className="flex items-center gap-3">
            <div className="px-2 py-0.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded">Live</div>
            <div className="text-[10px] font-black uppercase tracking-[0.4em] text-slate-500">Production Intelligence System</div>
          </div>
          <h2 className="text-6xl font-black tracking-tighter uppercase italic leading-none text-slate-900">
            {showListOnly ? 'Inventory' : 'Mission Control'}
          </h2>
          <p className="text-slate-500 font-medium max-w-xl">
            {showListOnly ? 'Comprehensive database of all production batches and historical records.' : 'Real-time telemetry and process monitoring for Fakir Apparels Washing Plant.'}
          </p>
        </div>
        
        <div className="flex flex-wrap items-center gap-4">
          <div className="flex items-center p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <button 
              onClick={() => setViewMode('telemetry')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                viewMode === 'telemetry' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Zap size={14} />
              Live
            </button>
            <button 
              onClick={() => setViewMode('grid')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                viewMode === 'grid' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <TableIcon size={14} />
              Grid
            </button>
            <button 
              onClick={() => setViewMode('inventory')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                viewMode === 'inventory' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <List size={14} />
              List
            </button>
          </div>

          <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <input 
              type="date" 
              className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 bg-transparent focus:outline-none"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
            />
            <div className="h-6 w-[1px] bg-slate-200" />
            <select 
              className="px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest text-slate-700 bg-transparent focus:outline-none appearance-none cursor-pointer"
              value={selectedShift}
              onChange={(e) => setSelectedShift(e.target.value as any)}
            >
              <option value="All">All Shifts</option>
              <option value="Day">Day Shift</option>
              <option value="Night">Night Shift</option>
            </select>
          </div>

          <div className="flex items-center gap-2 p-1 bg-white border border-slate-200 rounded-2xl shadow-sm">
            <a 
              href="/api/backup" 
              download 
              className="flex items-center gap-2 px-4 py-2.5 hover:bg-indigo-600 hover:text-white rounded-xl text-xs font-black uppercase tracking-widest transition-all text-slate-700"
            >
              <Download size={14} />
              Backup
            </a>
          </div>
          <div className="relative group">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4 group-focus-within:text-indigo-600 transition-colors" />
            <input 
              type="text" 
              placeholder="Filter style or ID..."
              className="pl-12 pr-6 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none focus:ring-4 focus:ring-indigo-600/10 w-full md:w-72 shadow-sm transition-all"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="relative">
            <Filter className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
            <select 
              className="pl-12 pr-10 py-3.5 bg-white border border-slate-200 rounded-2xl text-sm font-bold focus:outline-none appearance-none cursor-pointer shadow-sm hover:bg-slate-50 transition-all text-slate-700"
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
            >
              {statuses.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </div>
        </div>
      </header>

      {viewMode === 'telemetry' && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard 
              label="Shift Production" 
              value={filteredScans
                .filter(s => s.status.includes('Quality Check') && s.status.includes('End'))
                .reduce((acc, s) => acc + (s.ok_qty || 0), 0)
                .toLocaleString()} 
              icon={<Package className="text-indigo-500" />} 
              trend={selectedShift !== 'All' ? `${selectedShift} Shift` : "Daily Total"} 
            />
            <StatCard label="Active Batches" value={filteredBatches.length} icon={<Zap className="text-amber-500" />} trend="Filtered" />
            <StatCard label="System Integrity" value="99.9%" icon={<ShieldCheck className="text-emerald-500" />} trend="Secure" />
            <StatCard label="Database" value="Cloud" icon={<Globe className="text-pink-500" />} trend="Supabase" />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-indigo-600" />
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="font-black text-2xl uppercase tracking-tighter italic flex items-center gap-3 text-slate-900">
                      <BarChart3 className="w-6 h-6 text-indigo-600" />
                      Weekly Output Trend
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Total OK Garments (Last 7 Days)</p>
                  </div>
                </div>
                <div className="h-72 w-full">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getWeeklyTrendData()}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f0f0f0" />
                      <XAxis 
                        dataKey="date" 
                        axisLine={false} 
                        tickLine={false} 
                        tick={{ fontSize: 10, fontWeight: 800 }} 
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
                      <Bar dataKey="output" radius={[10, 10, 0, 0]} barSize={40} fill="#4f46e5" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-emerald-600" />
                <div className="flex items-center justify-between mb-10">
                  <div>
                    <h3 className="font-black text-2xl uppercase tracking-tighter italic flex items-center gap-3 text-slate-900">
                      <BarChart3 className="w-6 h-6 text-emerald-600" />
                      Process Distribution
                    </h3>
                    <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Active batches per department</p>
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
                        tick={{ fontSize: 10, fontWeight: 800 }} 
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

              {/* Live Activity Ticker */}
              <div className="bg-slate-900 rounded-[2.5rem] p-8 text-white relative overflow-hidden shadow-2xl">
                <div className="absolute top-0 right-0 p-8 opacity-10">
                  <Activity size={120} />
                </div>
                <div className="flex items-center gap-4 mb-6">
                  <div className="w-3 h-3 rounded-full bg-red-500 animate-pulse" />
                  <h3 className="text-sm font-black uppercase tracking-[0.3em]">Live Activity Stream</h3>
                </div>
                <div className="space-y-4">
                  {scans.slice(0, 3).map((scan, idx) => (
                    <motion.div 
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: idx * 0.1 }}
                      key={scan.id} 
                      className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all cursor-default"
                    >
                      <div className="flex items-center gap-4">
                        <div className="text-xs font-mono text-indigo-400 font-bold">{format(new Date(scan.timestamp), 'HH:mm')}</div>
                        <div className="h-4 w-[1px] bg-white/20" />
                        <div>
                          <p className="text-xs font-bold uppercase tracking-tight">{scan.style}</p>
                          <p className="text-[9px] font-black uppercase tracking-widest text-white/40">{scan.status}</p>
                        </div>
                      </div>
                      <div className="text-[10px] font-black uppercase tracking-widest text-emerald-400">Recorded</div>
                    </motion.div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-8">
              <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 shadow-[0_32px_64px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1.5 bg-slate-900" />
                <div className="flex items-center justify-between mb-10">
                  <h3 className="font-black text-2xl uppercase tracking-tighter italic flex items-center gap-3 text-slate-900">
                    <Activity className="w-6 h-6 text-slate-900" />
                    Core Status
                  </h3>
                </div>
                <div className="space-y-8">
                  <HealthItem label="Database Engine" status="Healthy" time="Supabase Cloud" />
                  <HealthItem label="Google Sheets" status="Active" time="Apps Script Sync" />
                  <HealthItem label="Network Latency" status="Optimal" time="0.12ms" />
                  
                  <div className="pt-8 border-t-2 border-dashed border-black/5">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Operator Leaderboard (Top 5)</p>
                    <div className="space-y-3">
                      {getWorkerLeaderboard().map((worker, idx) => (
                        <div key={worker.name} className="flex items-center justify-between p-3 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="flex items-center gap-3">
                            <div className="w-6 h-6 bg-slate-900 text-white rounded-full flex items-center justify-center text-[10px] font-black">
                              {idx + 1}
                            </div>
                            <span className="text-xs font-black uppercase tracking-tight text-slate-700">{worker.name}</span>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] font-black text-indigo-600">{worker.ok.toLocaleString()} PCS</p>
                            <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">{worker.count} SCANS</p>
                          </div>
                        </div>
                      ))}
                      {getWorkerLeaderboard().length === 0 && (
                        <p className="text-xs font-medium text-slate-400 italic text-center py-4">No operator data available.</p>
                      )}
                    </div>
                  </div>

                  <div className="pt-8 border-t-2 border-dashed border-black/5">
                    <p className="text-[10px] font-black uppercase tracking-[0.3em] text-slate-400 mb-4">Master Clock</p>
                    <div className="flex items-center justify-between bg-slate-900 text-white p-6 rounded-3xl shadow-xl">
                      <span className="text-4xl font-mono font-black tracking-tighter">{format(new Date(), 'HH:mm:ss')}</span>
                      <div className="text-right">
                        <p className="text-[8px] font-black uppercase tracking-widest opacity-50">Zone</p>
                        <p className="text-xs font-black">UTC-8</p>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Alerts Section */}
              <div className="bg-amber-50 border border-amber-100 p-8 rounded-[2.5rem]">
                <div className="flex items-center gap-3 mb-4 text-amber-600">
                  <AlertTriangle size={20} />
                  <h4 className="font-black uppercase tracking-widest text-xs">Attention Required</h4>
                </div>
                <div className="space-y-3">
                  {batches.filter(b => {
                    const latest = getLatestStatus(b.id);
                    return latest && isDelayed(latest);
                  }).slice(0, 2).map(batch => (
                    <div key={batch.id} className="p-4 bg-white rounded-2xl border border-amber-200 shadow-sm">
                      <p className="text-[10px] font-black uppercase tracking-widest text-amber-600 mb-1">Production Delay</p>
                      <p className="text-sm font-bold text-slate-900 uppercase tracking-tight">{batch.style}</p>
                      <p className="text-[10px] font-medium text-slate-500 mt-1">Waiting in {getLatestStatus(batch.id)?.location} for &gt;30m</p>
                    </div>
                  ))}
                  {batches.filter(b => {
                    const latest = getLatestStatus(b.id);
                    return latest && isDelayed(latest);
                  }).length === 0 && (
                    <p className="text-xs font-medium text-amber-600 italic">No critical delays detected. Operations normal.</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}

      {viewMode === 'grid' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-[0_32px_64px_-15px_rgba(0,0,0,0.05)]">
          <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-black text-3xl uppercase tracking-tighter italic text-slate-900">Master Production Grid</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Comprehensive cross-department process matrix</p>
            </div>
            <div className="flex items-center gap-3">
              <button 
                onClick={downloadCSV}
                className="px-4 py-2 bg-white border border-slate-200 rounded-xl text-[10px] font-black uppercase tracking-widest text-slate-600 flex items-center gap-2 hover:bg-slate-900 hover:text-white transition-all shadow-sm"
              >
                <Download size={14} />
                Export CSV
              </button>
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-50 text-emerald-600 rounded-lg text-[10px] font-bold uppercase tracking-widest border border-emerald-100">
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                Live Sync
              </div>
            </div>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse min-w-[1200px]">
              <thead>
                <tr className="bg-slate-50 text-[10px] uppercase tracking-[0.2em] font-black text-slate-400">
                  <th className="px-6 py-5 border-r border-slate-100 sticky left-0 bg-slate-50 z-10">Batch Details</th>
                  <th className="px-6 py-5 text-center border-r border-slate-100">Qty</th>
                  {PROCESS_STEPS.map(step => (
                    <th key={step.id} className="px-6 py-5 text-center border-r border-slate-200">{step.label}</th>
                  ))}
                  <th className="px-6 py-5 text-center border-r border-slate-200">QC Stats</th>
                  <th className="px-6 py-5 text-center border-r border-slate-200">Final Status</th>
                  <th className="px-6 py-5 text-center">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map(batch => (
                  <tr key={batch.id} className="hover:bg-slate-50/50 transition-colors group">
                    <td className="px-6 py-6 border-r border-slate-100 sticky left-0 bg-white group-hover:bg-slate-50/50 z-10">
                      <div className="flex flex-col">
                        <span className="font-mono text-xs font-black text-indigo-600">{batch.id}</span>
                        <span className="font-black text-sm uppercase tracking-tighter italic text-slate-900 mt-1">{batch.style}</span>
                        <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">{batch.buyer}</span>
                      </div>
                    </td>
                    <td className="px-6 py-6 border-r border-slate-100 text-center font-black text-xs text-slate-500">
                      {batch.quantity}
                    </td>
                      {PROCESS_STEPS.map(step => {
                        const status = getProcessStatus(batch.id, step.id);
                        return (
                          <td key={step.id} className="px-4 py-6 border-r border-slate-200 text-center">
                            {status ? (
                              <div className="flex flex-col items-center gap-1.5">
                                <span className={cn(
                                  "px-2.5 py-1 rounded-none text-[9px] font-black uppercase tracking-widest shadow-sm border border-slate-900",
                                  getStatusBadgeColor(status.status)
                                )}>
                                  {status.status.split(' - ')[1] || 'End'}
                                </span>
                                <span className="text-[8px] font-mono text-slate-400 font-bold">
                                  {format(new Date(status.timestamp), 'HH:mm')}
                                </span>
                                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                                  {status.worker_name.split(' ')[0]}
                                </span>
                                {status.machine_no && (
                                  <span className="text-[7px] font-black text-indigo-600 uppercase tracking-widest bg-indigo-50 px-1">
                                    {status.machine_no}
                                  </span>
                                )}
                              </div>
                            ) : (
                              <div className="flex flex-col items-center opacity-10">
                                <div className="w-8 h-1 bg-slate-200 rounded-none" />
                              </div>
                            )}
                          </td>
                        );
                      })}
                      <td className="px-6 py-6 border-r border-slate-200 text-center">
                        {(() => {
                          const qcScan = scans.find(s => s.batch_id === batch.id && s.status.includes('Quality Check'));
                          if (qcScan && (qcScan.ok_qty || qcScan.rejected_qty)) {
                            return (
                              <div className="flex flex-col gap-1 items-center">
                                <div className="flex gap-1">
                                  <span className="text-[8px] font-black text-emerald-600 bg-emerald-50 px-1 border border-emerald-100">OK:{qcScan.ok_qty}</span>
                                  <span className="text-[8px] font-black text-red-600 bg-red-50 px-1 border border-red-100">RJ:{qcScan.rejected_qty}</span>
                                </div>
                                <span className="text-[7px] font-bold text-slate-400 uppercase tracking-widest">IS:{qcScan.issued_qty}</span>
                              </div>
                            );
                          }
                          return <span className="text-[8px] font-black text-slate-200 uppercase tracking-widest">No Data</span>;
                        })()}
                      </td>
                      <td className="px-6 py-6 border-r border-slate-200 text-center">
                      <div className="flex flex-col items-center">
                        <div className={cn(
                          "w-3 h-3 rounded-full shadow-sm",
                          getLatestStatus(batch.id)?.status.includes('End') ? "bg-emerald-500" : "bg-slate-200"
                        )} />
                        <span className="text-[9px] font-black uppercase tracking-widest text-slate-400 mt-2">
                          {getLatestStatus(batch.id)?.status.includes('End') ? 'Completed' : 'In Progress'}
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-6 text-center">
                      <Link 
                        to={`/scan/${batch.id}`}
                        className="px-3 py-1.5 bg-indigo-600 text-white text-[9px] font-black uppercase tracking-widest rounded hover:bg-indigo-700 transition-all shadow-lg shadow-indigo-200"
                      >
                        Update
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {viewMode === 'inventory' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-[0_32px_64px_-15px_rgba(0,0,0,0.05)]">
          <div className="p-10 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
            <div>
              <h3 className="font-black text-3xl uppercase tracking-tighter italic text-slate-900">Inventory Database</h3>
              <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time production sequence records</p>
            </div>
            <button className="px-6 py-3 bg-white border border-slate-200 rounded-2xl text-[10px] font-black uppercase tracking-widest text-slate-500 flex items-center gap-2 hover:bg-slate-900 hover:text-white transition-all shadow-sm">
              <ArrowUpDown size={14} />
              Sort Sequence
            </button>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-slate-50 text-[11px] uppercase tracking-widest font-bold text-slate-400">
                  <th className="px-6 py-4">Batch ID</th>
                  <th className="px-6 py-4">Type</th>
                  <th className="px-6 py-4">Buyer</th>
                  <th className="px-6 py-4">Style</th>
                  <th className="px-6 py-4">Current Status</th>
                  <th className="px-6 py-4">Last Location</th>
                  <th className="px-6 py-4">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredBatches.map((batch) => {
                  const latest = getLatestStatus(batch.id);
                  const delayed = latest && isDelayed(latest);
                  return (
                    <tr key={batch.id} className={cn(
                      "hover:bg-slate-50/50 transition-colors",
                      delayed && "bg-red-50/50"
                    )}>
                      <td className="px-6 py-4 font-mono text-sm font-semibold text-slate-900">
                        <div className="flex items-center gap-2">
                          {batch.id}
                          {delayed && <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" title="Production Delay!" />}
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-[10px] font-bold uppercase tracking-wider bg-slate-100 px-2 py-1 rounded text-slate-500">
                          {batch.batch_type}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-600">{batch.buyer}</td>
                      <td className="px-6 py-4 text-sm font-bold text-slate-900">{batch.style}</td>
                      <td className="px-6 py-4">
                        {latest ? (
                          <span className={cn(
                            "px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider",
                            getStatusBadgeColor(latest.status)
                          )}>
                            {latest.status}
                          </span>
                        ) : (
                          <span className="text-xs text-slate-400 italic font-medium">No scans yet</span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-slate-400 font-medium">
                        {latest?.location || 'N/A'}
                      </td>
                      <td className="px-6 py-4 flex items-center gap-4">
                        <Link to={`/batch/${batch.id}`} className="text-indigo-600 hover:text-indigo-700 text-sm font-bold">Card</Link>
                        <Link to={`/scan/${batch.id}`} className="text-emerald-600 hover:text-emerald-700 text-sm font-bold">Update</Link>
                        <button 
                          onClick={() => setSelectedBatchId(selectedBatchId === batch.id ? null : batch.id)}
                          className="text-slate-400 hover:text-slate-600 text-sm font-bold"
                        >
                          History
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot className="bg-slate-50/50 border-t-2 border-slate-200">
                <tr className="text-sm font-black text-slate-900 uppercase italic">
                  <td colSpan={4} className="px-6 py-6 text-right">Total Inventory Output:</td>
                  <td colSpan={3} className="px-6 py-6 text-indigo-600">
                    {filteredBatches.reduce((acc, b) => acc + b.quantity, 0).toLocaleString()} PCS
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>
      )}

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
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative">
      <div className="absolute top-0 right-0 w-32 h-32 bg-slate-50 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-150 group-hover:bg-indigo-50" />
      <div className="flex items-center justify-between mb-6 relative z-10">
        <span className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">{label}</span>
        <div className="p-3 bg-slate-50 rounded-2xl group-hover:bg-indigo-600 group-hover:text-white transition-all shadow-inner">{icon}</div>
      </div>
      <div className="flex items-end justify-between relative z-10">
        <span className="text-5xl font-black tracking-tighter italic text-slate-900">{value}</span>
        {trend && (
          <span className={cn(
            "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm",
            trend.includes('+') || trend === "Active" || trend === "Secure" ? "bg-emerald-50 text-emerald-600 border border-emerald-100" : "bg-indigo-50 text-indigo-600 border border-indigo-100"
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
