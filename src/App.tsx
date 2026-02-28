import React from 'react';
import { BrowserRouter as Router, Routes, Route, Link } from 'react-router-dom';
import { LayoutDashboard, PlusCircle, QrCode, ClipboardList, MessageSquare } from 'lucide-react';
import Dashboard from './pages/Dashboard';
import CreateBatch from './pages/CreateBatch';
import BatchCard from './pages/BatchCard';
import UpdateStatus from './pages/UpdateStatus';
import TelegramSetup from './pages/TelegramSetup';

export default function App() {
  return (
    <Router>
      <div className="min-h-screen bg-[#F5F5F5] text-[#1A1A1A] font-sans">
        {/* Navigation Sidebar */}
        <nav className="fixed left-0 top-0 h-full w-64 bg-white border-r border-black/5 z-50 hidden md:flex flex-col">
          <div className="p-6 border-bottom border-black/5">
            <h1 className="text-xl font-bold tracking-tight flex items-center gap-2">
              <QrCode className="w-6 h-6 text-emerald-600" />
              Fakir Apparels
            </h1>
          </div>
          
          <div className="flex-1 px-4 py-6 space-y-2">
            <NavLink to="/" icon={<LayoutDashboard size={20} />} label="Dashboard" />
            <NavLink to="/create" icon={<PlusCircle size={20} />} label="New Batch" />
            <NavLink to="/batches" icon={<ClipboardList size={20} />} label="All Batches" />
            <NavLink to="/telegram-setup" icon={<MessageSquare size={20} />} label="Alarm Setup" />
          </div>

          <div className="p-6 border-t border-black/5">
            <p className="text-xs text-muted-foreground uppercase tracking-widest font-semibold">System Status</p>
            <div className="mt-2 flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-sm font-medium">Live Sync Active</span>
            </div>
          </div>
        </nav>

        {/* Mobile Navigation */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 bg-white border-t border-black/5 z-50 flex justify-around py-3 px-6">
          <Link to="/" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-emerald-600">
            <LayoutDashboard size={20} />
            <span className="text-[10px] font-medium uppercase">Dash</span>
          </Link>
          <Link to="/create" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-emerald-600">
            <PlusCircle size={20} />
            <span className="text-[10px] font-medium uppercase">New</span>
          </Link>
          <Link to="/batches" className="flex flex-col items-center gap-1 text-muted-foreground hover:text-emerald-600">
            <ClipboardList size={20} />
            <span className="text-[10px] font-medium uppercase">List</span>
          </Link>
        </nav>

        {/* Main Content */}
        <main className="md:ml-64 min-h-screen p-4 md:p-8 pb-24 md:pb-8">
          <Routes>
            <Route path="/" element={<Dashboard />} />
            <Route path="/create" element={<CreateBatch />} />
            <Route path="/batch/:id" element={<BatchCard />} />
            <Route path="/scan/:id" element={<UpdateStatus />} />
            <Route path="/batches" element={<Dashboard showListOnly={true} />} />
            <Route path="/telegram-setup" element={<TelegramSetup />} />
          </Routes>
        </main>
      </div>
    </Router>
  );
}

function NavLink({ to, icon, label }: { to: string; icon: React.ReactNode; label: string }) {
  return (
    <Link
      to={to}
      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all duration-200 hover:bg-black/5 text-muted-foreground hover:text-emerald-600 font-medium"
    >
      {icon}
      {label}
    </Link>
  );
}
