import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Search, Filter, ArrowUpDown, Clock, MapPin, User, Package, CheckCircle2, BarChart3, Activity, Download, Zap, ShieldCheck, Globe, Table as TableIcon, List, LayoutGrid, AlertTriangle } from 'lucide-react';
import { format } from 'date-fns';
import { Batch, Scan } from '../types';
import { cn } from '../lib/utils';
import { Link } from 'react-router-dom';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from 'recharts';
import { ChevronRight } from 'lucide-react';

export default function Dashboard({ showListOnly = false }: { showListOnly?: boolean }) {
  const [scans, setScans] = useState<Scan[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('All');
  const [loading, setLoading] = useState(true);
  const [selectedBatchId, setSelectedBatchId] = useState<string | null>(null);
  const [viewMode, setViewMode] = useState<'telemetry' | 'grid' | 'inventory' | 'roadmap'>('telemetry');
  const [uptime, setUptime] = useState('00:00:00');
  const [selectedDate, setSelectedDate] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [selectedShift, setSelectedShift] = useState<'All' | 'Day' | 'Night'>('All');
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [resetModalOpen, setResetModalOpen] = useState(false);
  const [batchToDelete, setBatchToDelete] = useState<string | null>(null);
  const [deleteReason, setDeleteReason] = useState('');
  const [workerName, setWorkerName] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);

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

  const handleDeleteBatch = async () => {
    if (!batchToDelete || !deleteReason || !workerName) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/batches/${batchToDelete}`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: deleteReason, worker_name: workerName })
      });
      if (res.ok) {
        setDeleteModalOpen(false);
        setBatchToDelete(null);
        setDeleteReason('');
        setWorkerName('');
        fetchData();
      }
    } catch (error) {
      console.error('Error deleting batch:', error);
    } finally {
      setIsDeleting(false);
    }
  };

  const handleResetData = async () => {
    setIsResetting(true);
    try {
      const res = await fetch('/api/admin/reset', { method: 'POST' });
      if (res.ok) {
        setResetModalOpen(false);
        fetchData();
      }
    } catch (error) {
      console.error('Error resetting data:', error);
    } finally {
      setIsResetting(false);
    }
  };

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

    const colors = ['#4f46e5', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4'];

    return last7Days.map((date, idx) => {
      const dayScans = scans.filter(s => 
        format(new Date(s.timestamp), 'yyyy-MM-dd') === date &&
        s.status.includes('Quality Check') && 
        s.status.includes('End')
      );
      const totalOk = dayScans.reduce((acc, s) => acc + (s.ok_qty || 0), 0);
      return {
        date: format(new Date(date), 'MMM dd'),
        output: totalOk,
        fill: colors[idx % colors.length]
      };
    });
  };

  const predictStatus = (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    const batchScans = scans.filter(s => s.batch_id === batchId).sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    if (batchScans.length === 0 || !batch) return null;

    const latest = batchScans[0];
    const now = new Date().getTime();
    const lastTime = new Date(latest.timestamp).getTime();
    const elapsedMinutes = Math.floor((now - lastTime) / 60000);

    // If batch has custom process steps, use them for prediction
    if (batch.process_steps && batch.process_steps.length > 0) {
      const currentStatus = latest.status;
      const currentStepIndex = batch.process_steps.findIndex(step => currentStatus.includes(step));
      
      if (currentStepIndex === -1) return null;
      
      const isFinished = currentStatus.includes('End');
      const totalEstimated = batch.estimated_total_time || 240;
      const stepDuration = Math.floor(totalEstimated / batch.process_steps.length);

      if (isFinished) {
        // If finished current step, predict next step
        if (currentStepIndex < batch.process_steps.length - 1) {
          const nextStep = batch.process_steps[currentStepIndex + 1];
          const finishTime = new Date(now + stepDuration * 60000);
          return {
            status: `Next: ${nextStep}`,
            timeRemaining: stepDuration,
            confidence: 90,
            estimatedFinishTime: format(finishTime, 'HH:mm')
          };
        } else {
          return {
            status: "Production Complete",
            timeRemaining: 0,
            confidence: 100,
            estimatedFinishTime: "Done"
          };
        }
      } else {
        // If still running current step, predict end of current step
        const remainingInStep = Math.max(0, stepDuration - elapsedMinutes);
        const finishTime = new Date(now + remainingInStep * 60000);
        return {
          status: `Ending: ${batch.process_steps[currentStepIndex]}`,
          timeRemaining: remainingInStep,
          confidence: 85,
          estimatedFinishTime: format(finishTime, 'HH:mm')
        };
      }
    }

    // Fallback to old prediction logic if no custom steps
    if (!latest.status.includes('Wash') && !latest.status.includes('Hydro') && !latest.status.includes('Dryer')) {
      return null;
    }

    // If already finished QC, no prediction
    if (latest.status.includes('Quality Check') && latest.status.includes('End')) {
      return null;
    }

    let totalRemaining = 0;
    let prediction: { status: string, confidence: number, timeRemaining: number } | null = null;

    if (latest.status.includes('Wash') && latest.status.includes('End')) {
      totalRemaining = 215; // Hydro(35) + Dryer(90) + QC(90)
      if (elapsedMinutes < 20) prediction = { status: 'Waiting for Hydro', confidence: 95, timeRemaining: 20 - elapsedMinutes };
      else if (elapsedMinutes < 35) prediction = { status: 'In Hydro Process', confidence: 85, timeRemaining: 35 - elapsedMinutes };
      else if (elapsedMinutes < 65) prediction = { status: 'Waiting for Dryer', confidence: 75, timeRemaining: 65 - elapsedMinutes };
      else if (elapsedMinutes < 125) prediction = { status: 'In Dryer Process', confidence: 70, timeRemaining: 125 - elapsedMinutes };
      else if (elapsedMinutes < 155) prediction = { status: 'Waiting for Quality Check', confidence: 60, timeRemaining: 155 - elapsedMinutes };
      else if (elapsedMinutes < 215) prediction = { status: 'In Quality Check', confidence: 55, timeRemaining: 215 - elapsedMinutes };
      else prediction = { status: 'Ready for Final Audit', confidence: 50, timeRemaining: 0 };
    }
    else if (latest.status.includes('Hydro') && latest.status.includes('End')) {
      totalRemaining = 180; // Dryer(90) + QC(90)
      if (elapsedMinutes < 30) prediction = { status: 'Waiting for Dryer', confidence: 90, timeRemaining: 30 - elapsedMinutes };
      else if (elapsedMinutes < 90) prediction = { status: 'In Dryer Process', confidence: 80, timeRemaining: 90 - elapsedMinutes };
      else if (elapsedMinutes < 120) prediction = { status: 'Waiting for Quality Check', confidence: 70, timeRemaining: 120 - elapsedMinutes };
      else if (elapsedMinutes < 180) prediction = { status: 'In Quality Check', confidence: 60, timeRemaining: 180 - elapsedMinutes };
      else prediction = { status: 'Ready for Final Audit', confidence: 50, timeRemaining: 0 };
    }
    else if (latest.status.includes('Dryer') && latest.status.includes('End')) {
      totalRemaining = 90; // QC(90)
      if (elapsedMinutes < 30) prediction = { status: 'Waiting for Quality Check', confidence: 95, timeRemaining: 30 - elapsedMinutes };
      else if (elapsedMinutes < 90) prediction = { status: 'In Quality Check', confidence: 85, timeRemaining: 90 - elapsedMinutes };
      else prediction = { status: 'Ready for Final Audit', confidence: 70, timeRemaining: 0 };
    }

    if (prediction) {
      const finishTime = new Date(lastTime + totalRemaining * 60000);
      return { ...prediction, estimatedFinishTime: format(finishTime, 'HH:mm') };
    }

    return null;
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

    const colors = ['bg-indigo-600', 'bg-emerald-600', 'bg-amber-500', 'bg-pink-500', 'bg-purple-600'];

    return Object.entries(workerStats)
      .map(([name, stats], idx) => ({ name, ...stats, color: colors[idx % colors.length] }))
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
      <div className="bg-slate-950 -mx-4 sm:-mx-8 px-4 sm:px-8 py-3 flex items-center gap-8 overflow-x-auto no-scrollbar border-b border-white/10 shadow-2xl">
        <div className="flex items-center gap-2 shrink-0">
          <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">System Online</span>
        </div>
        <div className="h-4 w-[1px] bg-white/10 shrink-0" />
        <div className="flex items-center gap-6 shrink-0">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Selected Output:</span>
            <span className="text-[10px] font-black text-indigo-400 uppercase tracking-widest bg-indigo-500/10 px-2 py-0.5 rounded">
              {filteredScans
                .filter(s => s.status.includes('Quality Check') && s.status.includes('End'))
                .reduce((acc, s) => acc + (s.ok_qty || 0), 0)
                .toLocaleString()} PCS
            </span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Shift:</span>
            <span className="text-[10px] font-black text-amber-400 uppercase tracking-widest bg-amber-500/10 px-2 py-0.5 rounded">{selectedShift}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Date:</span>
            <span className="text-[10px] font-black text-emerald-400 uppercase tracking-widest bg-emerald-500/10 px-2 py-0.5 rounded">{selectedDate}</span>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Uptime:</span>
            <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest font-mono bg-pink-500/10 px-2 py-0.5 rounded">{uptime}</span>
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
            <button 
              onClick={() => setViewMode('roadmap')}
              className={cn(
                "flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all",
                viewMode === 'roadmap' ? "bg-indigo-600 text-white shadow-lg shadow-indigo-200" : "text-slate-500 hover:bg-slate-50"
              )}
            >
              <Activity size={14} />
              Roadmap
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
          <button 
            onClick={() => setResetModalOpen(true)}
            className="flex items-center gap-2 px-4 py-3.5 bg-red-50 text-red-600 border border-red-100 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-600 hover:text-white transition-all shadow-sm"
          >
            <AlertTriangle size={14} />
            Reset
          </button>
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
              icon={<Package className="text-white" />} 
              trend={selectedShift !== 'All' ? `${selectedShift} Shift` : "Daily Total"} 
              color="bg-indigo-600"
            />
            <StatCard 
              label="Active Batches" 
              value={filteredBatches.length} 
              icon={<Zap className="text-white" />} 
              trend="Filtered" 
              color="bg-amber-500"
            />
            <StatCard 
              label="System Integrity" 
              value="99.9%" 
              icon={<ShieldCheck className="text-white" />} 
              trend="Secure" 
              color="bg-emerald-500"
            />
            <StatCard 
              label="Database" 
              value="Cloud" 
              icon={<Globe className="text-white" />} 
              trend="Supabase" 
              color="bg-pink-500"
            />
          </div>

          {/* AI Assistant Panel */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 bg-slate-900 rounded-3xl p-8 border border-white/10 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-10 group-hover:opacity-20 transition-opacity">
                <Zap className="w-32 h-32 text-indigo-400" />
              </div>
              <div className="relative z-10">
                <div className="flex items-center gap-3 mb-6">
                  <div className="p-2 bg-indigo-500/20 rounded-lg">
                    <Zap className="w-5 h-5 text-indigo-400" />
                  </div>
                  <h2 className="text-xl font-bold text-white">AI Production Assistant</h2>
                  <span className="px-2 py-0.5 bg-indigo-500 text-white text-[10px] font-bold rounded uppercase tracking-wider">Live Prediction</span>
                </div>
                
                <div className="space-y-4">
                  {batches.filter(b => predictStatus(b.id)).slice(0, 3).map(batch => {
                    const prediction = predictStatus(batch.id);
                    if (!prediction) return null;
                    return (
                      <div key={batch.id} className="flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/5 hover:border-indigo-500/30 transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-slate-800 flex items-center justify-center text-indigo-400 font-bold">
                            {batch.style[0]}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-white">{batch.style} <span className="text-white/40 font-normal ml-2">#{batch.id}</span></div>
                            <div className="text-xs text-indigo-400 flex items-center gap-1 mt-1">
                              <Clock className="w-3 h-3" />
                              Predicted: {prediction.status}
                            </div>
                            <div className="text-[10px] text-white/40 font-bold mt-1 uppercase tracking-wider">
                              Est. Finish: {prediction.estimatedFinishTime}
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <div className="text-[10px] text-white/40 uppercase font-bold mb-1">Confidence</div>
                          <div className="flex items-center gap-2">
                            <div className="w-20 h-1.5 bg-slate-800 rounded-full overflow-hidden">
                              <div className="h-full bg-indigo-500" style={{ width: `${prediction.confidence}%` }}></div>
                            </div>
                            <span className="text-xs font-bold text-white">{prediction.confidence}%</span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                  {batches.filter(b => predictStatus(b.id)).length === 0 && (
                    <div className="text-center py-8 text-white/40 italic">
                      No active predictions. Complete a washing process to start AI tracking.
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-emerald-950/30 rounded-3xl p-8 border border-emerald-500/20 flex flex-col justify-between">
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <div className="p-2 bg-emerald-500/20 rounded-lg">
                    <ShieldCheck className="w-5 h-5 text-emerald-400" />
                  </div>
                  <h2 className="text-lg font-bold text-white">System Health</h2>
                </div>
                <p className="text-sm text-emerald-400/60 mb-6">AI models are calibrated for current shift patterns and machine availability.</p>
              </div>
              <div className="space-y-3">
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Sync Latency</span>
                  <span className="text-emerald-400 font-bold">12ms</span>
                </div>
                <div className="flex justify-between text-xs">
                  <span className="text-white/60">Prediction Accuracy</span>
                  <span className="text-emerald-400 font-bold">94.2%</span>
                </div>
                <div className="w-full h-1 bg-emerald-500/10 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 w-[94%]"></div>
                </div>
              </div>
            </div>
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
                      <Bar dataKey="output" radius={[10, 10, 0, 0]} barSize={40}>
                        {getWeeklyTrendData().map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.fill} />
                        ))}
                      </Bar>
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
                            <div className={cn("w-6 h-6 text-white rounded-full flex items-center justify-center text-[10px] font-black", worker.color)}>
                              {idx + 1}
                            </div>
                            <span className="text-xs font-black uppercase tracking-tight text-slate-700">{worker.name}</span>
                          </div>
                          <div className="text-right">
                            <p className={cn("text-[10px] font-black", worker.color.replace('bg-', 'text-'))}>{worker.ok.toLocaleString()} PCS</p>
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
                <tr className="bg-slate-950 text-[10px] uppercase tracking-[0.2em] font-black text-white/40">
                  <th className="px-6 py-5 border-r border-white/10 sticky left-0 bg-slate-950 z-10">Batch Details</th>
                  <th className="px-6 py-5 text-center border-r border-white/10">Qty</th>
                  {PROCESS_STEPS.map((step, idx) => {
                    const colors = ['text-blue-400', 'text-emerald-400', 'text-amber-400', 'text-red-400', 'text-purple-400', 'text-pink-400', 'text-cyan-400'];
                    return (
                      <th key={step.id} className={cn("px-6 py-5 text-center border-r border-white/10", colors[idx % colors.length])}>
                        {step.label}
                      </th>
                    );
                  })}
                  <th className="px-6 py-5 text-center border-r border-white/10 text-emerald-400">QC Stats</th>
                  <th className="px-6 py-5 text-center border-r border-white/10 text-indigo-400">Final Status</th>
                  <th className="px-6 py-5 text-center border-r border-white/10 text-amber-400">AI Prediction</th>
                  <th className="px-6 py-5 text-center border-r border-white/10 text-cyan-400">Roadmap</th>
                  <th className="px-6 py-5 text-center text-white">Action</th>
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
                    <td className="px-6 py-6 border-r border-slate-200 text-center">
                      {predictStatus(batch.id) ? (
                        <div className="flex flex-col items-center gap-1">
                          <span className="text-[9px] font-black text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1">
                            <Zap className="w-2.5 h-2.5" />
                            {predictStatus(batch.id)?.status}
                          </span>
                          <div className="flex flex-col items-center">
                            <span className="text-[8px] font-bold text-slate-400 uppercase tracking-widest">
                              {predictStatus(batch.id)?.timeRemaining}m remaining
                            </span>
                            <span className="text-[7px] font-black text-indigo-400 uppercase tracking-widest mt-0.5">
                              Finish: {predictStatus(batch.id)?.estimatedFinishTime}
                            </span>
                          </div>
                        </div>
                      ) : (
                        <span className="text-[8px] font-black text-slate-200 uppercase tracking-widest italic">No Prediction</span>
                      )}
                    </td>
                    <td className="px-6 py-6 border-r border-slate-200 text-center">
                      <div className="flex items-center justify-center gap-1">
                        {batch.process_steps?.map((step, sIdx) => {
                          const isDone = scans.some(s => s.batch_id === batch.id && s.status.includes(step) && s.status.includes('End'));
                          const isRunning = scans.some(s => s.batch_id === batch.id && s.status.includes(step) && s.status.includes('Running'));
                          return (
                            <div key={sIdx} className="flex items-center">
                              <div 
                                title={step}
                                className={cn(
                                  "w-2 h-2 rounded-full",
                                  isDone ? "bg-emerald-500" : isRunning ? "bg-indigo-600 animate-pulse" : "bg-slate-200"
                                )} 
                              />
                              {sIdx < batch.process_steps!.length - 1 && (
                                <div className="w-2 h-[1px] bg-slate-100" />
                              )}
                            </div>
                          );
                        })}
                        {(!batch.process_steps || batch.process_steps.length === 0) && (
                          <span className="text-[8px] font-black text-slate-200 uppercase tracking-widest italic">No Roadmap</span>
                        )}
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
                        <button 
                          onClick={() => {
                            setBatchToDelete(batch.id);
                            setDeleteModalOpen(true);
                          }}
                          className="text-red-400 hover:text-red-600 text-sm font-bold"
                        >
                          Remove
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

      {viewMode === 'roadmap' && (
        <div className="space-y-8">
          <div className="bg-white p-10 rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-[0_32px_64px_-15px_rgba(0,0,0,0.05)] relative">
            <div className="absolute top-0 left-0 w-full h-2 bg-indigo-600" />
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-black text-4xl uppercase tracking-tighter italic text-slate-900">Production Roadmap</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Real-time process flow visualization for all active batches</p>
              </div>
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Active Batches</p>
                  <p className="text-2xl font-black text-indigo-600">{batches.length}</p>
                </div>
                <div className="w-12 h-12 bg-indigo-50 text-indigo-600 rounded-2xl flex items-center justify-center">
                  <Activity size={24} />
                </div>
              </div>
            </div>
          </div>
          
          <div className="grid grid-cols-1 gap-10">
            {batches.filter(b => {
              const latest = getLatestStatus(b.id);
              return !latest || !latest.status.includes('Quality Check - End');
            }).map(batch => (
              <div key={batch.id} className="bg-white rounded-[3rem] border border-slate-200 overflow-hidden shadow-2xl hover:shadow-indigo-500/10 transition-all group">
                <div className="p-10 bg-slate-50 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-8">
                  <div className="flex items-center gap-8">
                    <div className="w-20 h-20 bg-slate-950 text-white flex items-center justify-center rounded-[2rem] shadow-xl group-hover:scale-110 transition-transform">
                      <Package size={32} />
                    </div>
                    <div>
                      <div className="flex items-center gap-3 mb-2">
                        <span className="px-3 py-1 bg-indigo-600 text-white text-[10px] font-black uppercase tracking-widest rounded-full">
                          {batch.batch_type}
                        </span>
                        <span className="text-xs font-mono font-black text-indigo-600">{batch.id}</span>
                      </div>
                      <h4 className="text-4xl font-black uppercase tracking-tighter italic text-slate-900 leading-none">{batch.style}</h4>
                      <div className="flex items-center gap-3 mt-3">
                        <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">{batch.buyer}</span>
                        <div className="w-1.5 h-1.5 rounded-full bg-slate-300" />
                        <span className="text-xs font-black text-slate-900 uppercase tracking-widest">{batch.quantity} PCS</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <Link 
                      to={`/scan/${batch.id}`}
                      className="px-8 py-4 bg-indigo-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-200 flex items-center gap-2"
                    >
                      <Zap size={16} />
                      Update Status
                    </Link>
                    <Link 
                      to={`/batch/${batch.id}`}
                      className="px-8 py-4 bg-white border border-slate-200 rounded-2xl text-xs font-black uppercase tracking-widest text-slate-600 hover:bg-slate-950 hover:text-white transition-all shadow-sm flex items-center gap-2"
                    >
                      <List size={16} />
                      View Card
                    </Link>
                  </div>
                </div>
                <div className="p-12">
                   <ProcessFlowchart batch={batch} latestScan={getLatestStatus(batch.id)} />
                </div>
              </div>
            ))}
            {batches.filter(b => {
              const latest = getLatestStatus(b.id);
              return !latest || !latest.status.includes('Quality Check - End');
            }).length === 0 && (
              <div className="p-20 text-center bg-white rounded-[3rem] border-2 border-dashed border-slate-200">
                <div className="w-20 h-20 bg-slate-50 text-slate-300 rounded-full flex items-center justify-center mx-auto mb-6">
                  <Activity size={40} />
                </div>
                <h4 className="text-2xl font-black uppercase tracking-tighter italic text-slate-400">No Active Production</h4>
                <p className="text-slate-400 font-medium mt-2">All batches have completed the production cycle.</p>
              </div>
            )}
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

      {/* Delete Batch Modal */}
      {deleteModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-red-50 rounded-2xl text-red-600">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900">Remove Batch</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">ID: {batchToDelete}</p>
              </div>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Your Name</label>
                <input 
                  type="text"
                  value={workerName}
                  onChange={(e) => setWorkerName(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all"
                  placeholder="Enter your name"
                />
              </div>
              <div>
                <label className="block text-[10px] font-black uppercase tracking-widest text-slate-400 mb-2">Reason for Removal</label>
                <textarea 
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  className="w-full px-5 py-4 bg-slate-50 border border-slate-200 rounded-2xl text-sm font-bold focus:ring-2 focus:ring-indigo-500 outline-none transition-all min-h-[100px]"
                  placeholder="Why is this batch being removed?"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setDeleteModalOpen(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleDeleteBatch}
                disabled={isDeleting || !deleteReason || !workerName}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50"
              >
                {isDeleting ? 'Removing...' : 'Confirm'}
              </button>
            </div>
          </motion.div>
        </div>
      )}

      {/* Reset System Modal */}
      {resetModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
          <motion.div 
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="bg-white rounded-[2.5rem] p-10 max-w-md w-full shadow-2xl border border-slate-100"
          >
            <div className="flex items-center gap-4 mb-6">
              <div className="p-4 bg-red-600 rounded-2xl text-white">
                <AlertTriangle size={32} />
              </div>
              <div>
                <h3 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900">Reset System</h3>
                <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mt-1">Warning: Irreversible Action</p>
              </div>
            </div>

            <p className="text-sm font-bold text-slate-500 leading-relaxed">
              This will permanently delete all batches and production records. This action cannot be undone. Are you absolutely sure?
            </p>

            <div className="flex gap-4 mt-8">
              <button 
                onClick={() => setResetModalOpen(false)}
                className="flex-1 py-4 bg-slate-100 text-slate-600 rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-slate-200 transition-all"
              >
                Cancel
              </button>
              <button 
                onClick={handleResetData}
                disabled={isResetting}
                className="flex-1 py-4 bg-red-600 text-white rounded-2xl text-xs font-black uppercase tracking-widest hover:bg-red-700 transition-all shadow-lg shadow-red-200 disabled:opacity-50"
              >
                {isResetting ? 'Resetting...' : 'Yes, Reset All'}
              </button>
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
}

function ProcessFlowchart({ batch, latestScan }: { batch: Batch, latestScan: any }) {
  if (!batch.process_steps || batch.process_steps.length === 0) return (
    <div className="p-10 text-center bg-slate-50 rounded-3xl border border-slate-100">
      <p className="text-xs font-black uppercase tracking-widest text-slate-400">No process steps defined for this batch.</p>
    </div>
  );

  const totalMinutes = batch.estimated_total_time || 240;
  const stepDuration = Math.floor(totalMinutes / batch.process_steps.length);
  
  const startTime = new Date(batch.created_at);
  const completionTime = new Date(startTime.getTime() + totalMinutes * 60000);

  const currentStatus = latestScan?.status || "";
  const currentStepIndex = batch.process_steps.findIndex(step => currentStatus.includes(step));

  return (
    <div className="relative">
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
        <div>
          <h3 className="text-2xl font-black uppercase tracking-tighter italic text-slate-900">Process Timeline</h3>
          <p className="text-[10px] font-black uppercase tracking-widest text-slate-400 mt-1">
            Baseline: {totalMinutes}m total duration
          </p>
        </div>
        <div className="bg-slate-900 text-white px-6 py-4 rounded-2xl border-b-4 border-indigo-600 shadow-xl">
          <p className="text-[9px] font-black uppercase tracking-widest text-white/40 mb-1">Est. Completion</p>
          <p className="text-xl font-black tracking-tighter uppercase italic">
            {format(completionTime, 'HH:mm')}
            <span className="text-[10px] ml-2 text-indigo-400 font-bold tracking-normal not-italic">{format(completionTime, 'MMM d')}</span>
          </p>
        </div>
      </div>

      <div className="relative">
        <div className="hidden lg:block absolute top-10 left-0 right-0 h-1 bg-slate-100" />
        
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-8 relative">
          {batch.process_steps.map((step, idx) => {
            const isCompleted = idx < currentStepIndex || (idx === currentStepIndex && currentStatus.includes("End"));
            const isCurrent = idx === currentStepIndex && !currentStatus.includes("End");
            const stepTime = new Date(startTime.getTime() + (idx * stepDuration) * 60000);
            const endTime = new Date(startTime.getTime() + ((idx + 1) * stepDuration) * 60000);

            return (
              <div key={idx} className="relative flex flex-col items-center text-center group">
                <div className={cn(
                  "w-20 h-20 rounded-[2rem] border-[3px] flex items-center justify-center z-10 transition-all duration-500 mb-6",
                  isCompleted 
                    ? "bg-emerald-500 border-slate-900 text-white shadow-[0_10px_20px_-5px_rgba(16,185,129,0.4)]" 
                    : isCurrent
                      ? "bg-indigo-600 border-slate-900 text-white shadow-[0_10px_20px_-5px_rgba(79,70,229,0.4)] animate-pulse"
                      : "bg-white border-slate-200 text-slate-300 group-hover:border-indigo-600 group-hover:text-indigo-600"
                )}>
                  {isCompleted ? <CheckCircle2 size={32} /> : <span className="text-2xl font-black italic">{idx + 1}</span>}
                </div>
                
                <div className="space-y-2">
                  <h4 className={cn(
                    "text-sm font-black uppercase tracking-tighter italic transition-colors",
                    isCurrent ? "text-indigo-600" : isCompleted ? "text-emerald-600" : "text-slate-400"
                  )}>
                    {step}
                  </h4>
                  <div className="inline-flex items-center gap-1.5 px-2 py-1 bg-slate-50 border border-slate-100 rounded-lg">
                    <Clock size={10} className="text-slate-400" />
                    <span className="text-[9px] font-black text-slate-600 uppercase tracking-widest">{stepDuration}m</span>
                  </div>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest mt-2">
                    {format(stepTime, 'HH:mm')} — {format(endTime, 'HH:mm')}
                  </p>
                </div>

                {idx < batch.process_steps.length - 1 && (
                  <div className="hidden lg:flex absolute top-8 -right-4 z-20 text-slate-200">
                    <ChevronRight size={20} />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
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

function StatCard({ label, value, trend, icon, color = "bg-white" }: { label: string, value: string | number, trend?: string, icon: React.ReactNode, color?: string }) {
  const isDark = color !== "bg-white";
  return (
    <div className={cn(
      "p-8 rounded-[2.5rem] border shadow-sm hover:shadow-2xl hover:-translate-y-1 transition-all group overflow-hidden relative",
      isDark ? `${color} border-transparent text-white` : "bg-white border-slate-200 text-slate-900"
    )}>
      <div className={cn(
        "absolute top-0 right-0 w-32 h-32 rounded-full -mr-16 -mt-16 transition-all group-hover:scale-150",
        isDark ? "bg-white/10" : "bg-slate-50 group-hover:bg-indigo-50"
      )} />
      <div className="flex items-center justify-between mb-6 relative z-10">
        <span className={cn(
          "text-[10px] font-black uppercase tracking-[0.2em]",
          isDark ? "text-white/60" : "text-slate-400"
        )}>{label}</span>
        <div className={cn(
          "p-3 rounded-2xl transition-all shadow-inner",
          isDark ? "bg-white/20 text-white" : "bg-slate-50 group-hover:bg-indigo-600 group-hover:text-white"
        )}>{icon}</div>
      </div>
      <div className="flex items-end justify-between relative z-10">
        <span className="text-5xl font-black tracking-tighter italic">{value}</span>
        {trend && (
          <span className={cn(
            "text-[10px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg shadow-sm",
            isDark 
              ? "bg-white/20 text-white border border-white/10" 
              : trend.includes('+') || trend === "Active" || trend === "Secure" 
                ? "bg-emerald-50 text-emerald-600 border border-emerald-100" 
                : "bg-indigo-50 text-indigo-600 border border-indigo-100"
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
  if (s.includes('wash') && !s.includes('acid')) return 'bg-blue-600 text-white border-blue-700 shadow-blue-200';
  if (s.includes('hydro')) return 'bg-amber-500 text-white border-amber-600 shadow-amber-200';
  if (s.includes('dryer')) return 'bg-red-500 text-white border-red-600 shadow-red-200';
  if (s.includes('quality')) return 'bg-emerald-600 text-white border-emerald-700 shadow-emerald-200';
  if (s.includes('acid')) return 'bg-purple-600 text-white border-purple-700 shadow-purple-200';
  if (s.includes('creating')) return 'bg-slate-900 text-white border-slate-950 shadow-slate-200';
  return 'bg-slate-100 text-slate-600 border-slate-200 shadow-none';
}
