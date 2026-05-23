'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { ShieldCheck, Flag, Receipt, TestTube, Crosshair, AlertTriangle, PlayCircle, StopCircle, ArrowUpRight } from 'lucide-react';
import Link from 'next/link';

export default function GovernanceHubPage() {
  const [budgets, setBudgets] = useState<any[]>([]);
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [b, f] = await Promise.all([
         supabase.from('budgets').select('*'),
         supabase.from('flags').select('*')
      ]);

      if (b.data) setBudgets(b.data);
      if (f.data) setFlags(f.data);
      setLoading(false);
    }
    loadData();
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-black font-mono text-[12px] text-[#888] overflow-y-auto">
      
      <div className="p-8 border-b border-[#1a1a1a] bg-[#050505] flex items-center justify-between">
         <div>
           <div className="flex items-center gap-2 mb-1">
             <ShieldCheck className="h-4 w-4 text-emerald-500" />
             <h1 className="text-white text-xl font-bold uppercase tracking-tight">Platform Governance Hub</h1>
           </div>
           <p className="text-white/30 text-[10px]">Central control plane for operations, budget bounds, and experiments.</p>
         </div>
      </div>

      <div className="p-4 md:p-8 grid grid-cols-1 md:grid-cols-2 gap-8 lg:gap-12">
         
         <div className="space-y-8">
            {/* Feature Flags Quick View */}
            <div className="bg-[#050505] border border-[#1a1a1a] rounded-lg p-6">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-bold uppercase tracking-widest text-[11px] flex items-center gap-2">
                     <Flag className="h-4 w-4 text-white/40" /> Active Rollouts
                  </h3>
                  <Link href="/flags" className="text-[9px] uppercase font-bold text-white/30 hover:text-white flex items-center gap-1 transition-colors">
                     Manage <ArrowUpRight className="h-3 w-3" />
                  </Link>
               </div>
               <div className="space-y-4">
                  {loading ? <div className="text-white/20">Loading...</div> : flags.map(f => (
                     <div key={f.id} className="flex items-center justify-between p-3 bg-black border border-[#1a1a1a] rounded hover:border-white/10">
                        <div>
                           <div className="text-white font-bold capitalize">{f.name}</div>
                           <div className="text-white/30 text-[9px] mt-0.5">{f.id}</div>
                        </div>
                        <div className={`px-2 py-1 rounded text-[9px] font-bold uppercase ${f.is_enabled ? 'bg-emerald-500/10 text-emerald-500 border border-emerald-500/20' : 'bg-white/5 text-white/30 border border-white/10'}`}>
                           {f.is_enabled ? 'ENABLED' : 'DISABLED'}
                        </div>
                     </div>
                  ))}
               </div>
            </div>

            {/* Experimentation (Wait) */}
            <div className="bg-[#020202] border border-[#1a1a1a] rounded-lg p-6 relative overflow-hidden">
               <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.02)_50%,transparent_75%,transparent_100%)] bg-[length:20px_20px]" />
               <div className="flex items-center justify-between mb-4 relative z-10">
                  <h3 className="text-white font-bold uppercase tracking-widest text-[11px] flex items-center gap-2">
                     <TestTube className="h-4 w-4 text-white/40" /> Experiment Framework
                  </h3>
               </div>
               <div className="relative z-10">
                  <p className="text-[10px] text-white/40 leading-relaxed mb-4">
                     A/B testing and algorithmic experiment tracks are currently <span className="text-amber-500 font-bold uppercase">LOCKED</span> pending completion of Phase 3 Cost Baselines. 
                  </p>
                  <button disabled className="bg-white/5 border border-white/10 text-white/20 px-4 py-2 font-bold uppercase text-[10px] rounded cursor-not-allowed">
                     FRAMEWORK UNAVAILABLE
                  </button>
               </div>
            </div>
         </div>

         <div className="space-y-8">
            {/* Budgets & Cost Guardrails */}
            <div className="bg-[#050505] border border-[#1a1a1a] rounded-lg p-6">
               <div className="flex items-center justify-between mb-6">
                  <h3 className="text-white font-bold uppercase tracking-widest text-[11px] flex items-center gap-2">
                     <Receipt className="h-4 w-4 text-white/40" /> Budget Guardrails
                  </h3>
                  <Link href="/finance/cost" className="text-[9px] uppercase font-bold text-white/30 hover:text-white flex items-center gap-1 transition-colors">
                     Unit Analytics <ArrowUpRight className="h-3 w-3" />
                  </Link>
               </div>
               <div className="space-y-5">
                  {loading ? <div className="text-white/20">Loading...</div> : budgets.map(b => {
                     const pct = (b.current_spend / b.daily_threshold) * 100;
                     const isWarning = pct > 80;
                     
                     return (
                       <div key={b.id} className="bg-black p-4 rounded border border-[#1a1a1a]">
                          <div className="flex justify-between items-center mb-3">
                             <div className="flex items-center gap-2">
                                <Crosshair className={`h-3.5 w-3.5 ${isWarning ? 'text-amber-500' : 'text-emerald-500'}`} />
                                <span className="text-white font-bold capitalize">{b.category} Budget</span>
                             </div>
                             <span className="text-[10px] uppercase text-white/40">Action on limit: <span className="text-white">{b.action_on_breach.replace('_', ' ')}</span></span>
                          </div>
                          
                          <div className="flex justify-between text-[10px] uppercase font-mono mb-1.5">
                             <span className="text-emerald-500 font-bold">${Number(b.current_spend).toFixed(2)} spent</span>
                             <span className="text-white/40">${Number(b.daily_threshold).toFixed(2)} limit</span>
                          </div>
                          <div className="h-1.5 w-full bg-[#1a1a1a] rounded-full overflow-hidden">
                             <div className={`h-full ${isWarning ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${Math.min(pct, 100)}%` }} />
                          </div>
                       </div>
                     )
                  })}
               </div>
            </div>
            
            {/* Master Kill Switches */}
            <div className="border border-red-500/20 bg-red-500/5 rounded-lg p-6">
               <h3 className="text-red-500 font-bold uppercase tracking-widest text-[11px] flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-4 w-4" /> Emergency Controls
               </h3>
               <p className="text-[10px] text-red-500/60 leading-relaxed mb-4">
                 Instantly halt costly or failing subsystems. This overrides all active feature flags and reverts platform to baseline state. No deployment required.
               </p>
               <div className="grid grid-cols-2 gap-3">
                  <button className="flex items-center justify-center gap-2 bg-red-950/40 border border-red-500/30 text-red-500 font-bold uppercase text-[9px] py-2.5 rounded hover:bg-red-900/40 transition-colors">
                     <StopCircle className="h-3 w-3" /> Disable Auto-Dispatch
                  </button>
                  <button className="flex items-center justify-center gap-2 bg-red-950/40 border border-red-500/30 text-red-500 font-bold uppercase text-[9px] py-2.5 rounded hover:bg-red-900/40 transition-colors">
                     <StopCircle className="h-3 w-3" /> Revert Search V2
                  </button>
               </div>
            </div>

         </div>

      </div>

    </div>
  );
}
