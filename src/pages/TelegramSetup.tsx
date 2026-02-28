import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { MessageSquare, RefreshCw, CheckCircle2, AlertCircle, ExternalLink } from 'lucide-react';

export default function TelegramSetup() {
  const [status, setStatus] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const checkUpdates = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/telegram-setup');
      const data = await response.json();
      setStatus(data);
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    checkUpdates();
  }, []);

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <header>
        <h1 className="text-3xl font-black uppercase tracking-tighter">Telegram Alarm Setup</h1>
        <p className="text-muted-foreground mt-2">Configure your production delay alerts bot.</p>
      </header>

      <div className="bg-white border-2 border-black p-8 space-y-6">
        <div className="flex items-start gap-4">
          <div className="w-10 h-10 bg-black text-white flex items-center justify-center shrink-0">
            <MessageSquare size={20} />
          </div>
          <div className="space-y-4">
            <h2 className="text-xl font-bold uppercase tracking-tight">Step 1: Open your Bot</h2>
            <p className="text-sm text-slate-600 leading-relaxed">
              Open your new bot in Telegram and send it a message (like "Hello" or "/start"). 
              This allows the system to find your unique Chat ID.
            </p>
            <a 
              href="https://t.me/ProductionAlarm_Bot" 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-4 py-2 bg-slate-100 border border-black/10 font-bold text-xs uppercase tracking-widest hover:bg-slate-200 transition-colors"
            >
              Open @ProductionAlarm_Bot <ExternalLink size={14} />
            </a>
          </div>
        </div>

        <div className="border-t-2 border-black/5 pt-8 flex items-start gap-4">
          <div className="w-10 h-10 bg-black text-white flex items-center justify-center shrink-0">
            <RefreshCw size={20} className={loading ? 'animate-spin' : ''} />
          </div>
          <div className="space-y-4 flex-1">
            <div className="flex items-center justify-between">
              <h2 className="text-xl font-bold uppercase tracking-tight">Step 2: Discover Chat ID</h2>
              <button 
                onClick={checkUpdates}
                disabled={loading}
                className="px-4 py-2 bg-black text-white font-bold text-xs uppercase tracking-widest hover:bg-slate-800 transition-colors disabled:opacity-50"
              >
                {loading ? 'Checking...' : 'Check Updates'}
              </button>
            </div>

            {status?.chat_id ? (
              <div className="bg-emerald-50 border border-emerald-200 p-4 flex items-start gap-3">
                <CheckCircle2 className="text-emerald-500 shrink-0" size={20} />
                <div>
                  <p className="font-bold text-emerald-900 uppercase text-xs tracking-widest">Success! Chat ID Found</p>
                  <p className="text-2xl font-mono font-black text-emerald-900 mt-1">{status.chat_id}</p>
                  <p className="text-xs text-emerald-700 mt-2">
                    Found message from <strong>{status.from}</strong>: "{status.text}"
                  </p>
                  <div className="mt-4 p-3 bg-white border border-emerald-200 text-[10px] font-mono text-slate-600">
                    Set this value as <strong>TELEGRAM_CHAT_ID</strong> in your environment variables.
                  </div>
                </div>
              </div>
            ) : (
              <div className="bg-slate-50 border border-slate-200 p-4 flex items-start gap-3">
                <AlertCircle className="text-slate-400 shrink-0" size={20} />
                <div>
                  <p className="font-bold text-slate-900 uppercase text-xs tracking-widest">Waiting for message...</p>
                  <p className="text-sm text-slate-600 mt-1">
                    No recent messages detected. Please send a message to the bot first, then click "Check Updates".
                  </p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-slate-900 text-white p-8">
        <h3 className="text-sm font-black uppercase tracking-[0.2em] text-white/40 mb-4">How it works</h3>
        <ul className="space-y-3 text-sm text-white/70">
          <li className="flex gap-3">
            <span className="text-white font-bold">01.</span>
            <span>The system monitors batches in <strong>Hydro</strong> and <strong>Dryer</strong> waiting areas.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-white font-bold">02.</span>
            <span>If a batch waits for more than <strong>30 minutes</strong>, an alert is triggered.</span>
          </li>
          <li className="flex gap-3">
            <span className="text-white font-bold">03.</span>
            <span>The bot sends a detailed message to your Telegram account using the Chat ID above.</span>
          </li>
        </ul>
      </div>
    </div>
  );
}
