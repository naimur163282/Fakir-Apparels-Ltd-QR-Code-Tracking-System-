import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link, useLocation } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, QrCode, ClipboardList, Settings, LogOut, User as UserIcon, Activity, Table as TableIcon } from 'lucide-react';
import { cn } from './lib/utils';
import Dashboard from './pages/Dashboard';
import CreateBatch from './pages/CreateBatch';
import BatchCard from './pages/BatchCard';
import UpdateStatus from './pages/UpdateStatus';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F8FAFC] text-[#1E293B] font-sans">
        {/* Navigation Sidebar */}
        <nav className="fixed left-0 top-0 h-full w-64 bg-white border-r-[3px] border-slate-900 z-50 hidden md:flex flex-col">
          <div className="p-8 border-b-[3px] border-slate-900 bg-slate-50">
            <h1 className="text-2xl font-black tracking-tighter flex items-center gap-3 text-slate-900 italic uppercase">
              <div className="p-2 bg-slate-900 text-white">
                <QrCode className="w-6 h-6" />
              </div>
              Fakir
            </h1>
          </div>
          
          <div className="flex-1 px-4 py-8 space-y-3">
            <NavLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
            <NavLink to="/create" icon={<PlusCircle size={20} />} label="New Batch" />
            <NavLink to="/batches" icon={<ClipboardList size={20} />} label="All Batches" />
            <NavLink to="/settings" icon={<Settings size={20} />} label="Settings" />
            <div className="pt-4 px-5">
              <div className="p-4 bg-emerald-50 border-[3px] border-slate-900 shadow-[4px_4px_0_0_rgba(16,185,129,1)]">
                <div className="flex items-center gap-3 mb-2">
                  <TableIcon size={16} className="text-emerald-600" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-900">Sheets Sync</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  <span className="text-[9px] font-bold text-emerald-700 uppercase tracking-widest">Connected</span>
                </div>
              </div>
            </div>
          </div>

          <div className="p-4 border-t-[3px] border-slate-900">
            <div className="flex items-center gap-3 p-4 bg-slate-900 text-white border-[3px] border-slate-900 shadow-[4px_4px_0_0_rgba(79,70,229,1)]">
              <div className="w-10 h-10 bg-indigo-600 text-white flex items-center justify-center">
                <UserIcon size={20} />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[10px] font-black uppercase tracking-widest truncate">Admin User</p>
                <p className="text-[8px] font-bold text-indigo-400 uppercase tracking-[0.2em] truncate">Plant Manager</p>
              </div>
              <button className="text-white/40 hover:text-red-500 transition-colors">
                <LogOut size={16} />
              </button>
            </div>
          </div>

          <div className="p-8 border-t-[3px] border-slate-900 bg-slate-50">
            <p className="text-[10px] text-slate-400 uppercase tracking-[0.3em] font-black">System Status</p>
            <div className="mt-4 flex items-center gap-3">
              <div className="w-2.5 h-2.5 bg-emerald-500 animate-pulse border border-emerald-900" />
              <span className="text-[11px] font-black text-slate-900 uppercase tracking-widest italic">Live Sync Active</span>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-slate-200 z-50 flex justify-around py-3 px-6 shadow-[0_-4px_20px_rgba(0,0,0,0.05)]">
          <Link to="/" className="flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors">
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider">Dash</span>
          </Link>
          <Link to="/create" className="flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors">
            <PlusCircle size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider">New</span>
          </Link>
          <Link to="/batches" className="flex flex-col items-center gap-1 text-slate-400 hover:text-indigo-600 transition-colors">
            <ClipboardList size={20} />
            <span className="text-[10px] font-bold uppercase tracking-wider">List</span>
          </Link>
        </nav>

        {/* Main Content */}
        <main className="md:ml-64 min-h-screen p-4 md:p-8 pb-32 md:pb-24">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateBatch />} />
            <Route path="/batch/:id" element={<BatchCard />} />
            <Route path="/scan/:id" element={<UpdateStatus />} />
            <Route path="/batches" element={<Dashboard showListOnly={true} />} />
          </Routes>
        </main>

        {/* Live Production Marquee */}
        <div className="fixed bottom-0 left-0 md:left-64 right-0 bg-slate-900 border-t border-white/10 h-10 z-[60] flex items-center overflow-hidden pointer-events-none">
          <div className="flex items-center gap-4 px-6 shrink-0 bg-indigo-600 h-full text-white text-[10px] font-black uppercase tracking-widest z-10">
            <Activity size={14} className="animate-pulse" />
            Live Feed
          </div>
          <div className="flex-1 overflow-hidden relative">
            <div className="flex items-center gap-12 whitespace-nowrap animate-marquee py-2">
              <MarqueeItem text="Batch BT-928374 completed Washing" />
              <MarqueeItem text="System Health: 99.9% Optimal" />
              <MarqueeItem text="New Batch Created: SS24-DR-001" />
              <MarqueeItem text="Plant Efficiency at 94.2%" />
              <MarqueeItem text="Shift Change: 08:00 AM" />
              <MarqueeItem text="Batch BT-112233 waiting in Hydro for 45m" isAlert />
              <MarqueeItem text="Production Target: 12,000 PCS" />
              {/* Duplicate for seamless loop */}
              <MarqueeItem text="Batch BT-928374 completed Washing" />
              <MarqueeItem text="System Health: 99.9% Optimal" />
              <MarqueeItem text="New Batch Created: SS24-DR-001" />
              <MarqueeItem text="Plant Efficiency at 94.2%" />
              <MarqueeItem text="Shift Change: 08:00 AM" />
              <MarqueeItem text="Batch BT-112233 waiting in Hydro for 45m" isAlert />
              <MarqueeItem text="Production Target: 12,000 PCS" />
            </div>
          </div>
        </div>
      </div>
    </Router>
  );
}

function MarqueeItem({ text, isAlert = false }: { text: string, isAlert?: boolean }) {
  return (
    <div className="flex items-center gap-3">
      <div className={cn("w-1.5 h-1.5 rounded-full", isAlert ? "bg-red-500 animate-pulse" : "bg-emerald-500")} />
      <span className={cn("text-[10px] font-black uppercase tracking-widest", isAlert ? "text-red-400" : "text-white/60")}>
        {text}
      </span>
    </div>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  const location = useLocation();
  const isActive = location.pathname === to;

  return (
    <Link
      to={to}
      className={cn(
        "flex items-center gap-3 px-5 py-4 transition-all duration-200 font-black text-[10px] uppercase tracking-[0.2em] italic",
        isActive 
          ? "bg-indigo-600 text-white shadow-[4px_4px_0_0_rgba(15,23,42,1)] translate-x-1" 
          : "text-slate-500 hover:bg-slate-50 hover:text-indigo-600"
      )}
    >
      {icon}
      {label}
    </Link>
  );
}
