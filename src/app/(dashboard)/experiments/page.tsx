'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { TestTube, Play, Pause, CircleOff, Archive, Target, Clock, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { formatDistanceToNow } from 'date-fns';

export default function ExperimentsIndexPage() {
  const [experiments, setExperiments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const { data } = await supabase.from('experiments').select('*, experiment_variants(id)').order('created_at', { ascending: false });
      if (data) setExperiments(data);
      setLoading(false);
    }
    load();
  }, []);

  const STATUS_COLORS: Record<string, string> = {
    running: 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20',
    paused: 'text-amber-500 bg-amber-500/10 border-amber-500/20',
    draft: 'text-white/40 bg-white/5 border-white/10',
    approved: 'text-blue-500 bg-blue-500/10 border-blue-500/20',
    completed: 'text-purple-500 bg-purple-500/10 border-purple-500/20'
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-black overflow-y-auto font-mono text-[12px] text-[#888]">
      
      <div className="p-8 border-b border-[#1a1a1a] bg-[#050505] flex items-center justify-between">
         <div>
           <div className="flex items-center gap-2 mb-1">
             <TestTube className="h-4 w-4 text-emerald-500" />
             <h1 className="text-white text-xl font-bold uppercase tracking-tight">Experimentation Framework</h1>
           </div>
           <p className="text-white/30 text-[10px]">Deterministic A/B testing with automated risk guardrails.</p>
         </div>
         <button className="bg-white text-black px-4 py-2 rounded font-bold uppercase text-[10px] hover:bg-white/90">
            Define Experiment
         </button>
      </div>

      <div className="flex-1 p-8 grid grid-cols-[1fr_250px] gap-8">
         <div className="space-y-4">
            
            {loading ? <div className="text-white/20">Syncing models...</div> : 
             experiments.length === 0 ? <div className="text-white/20">No active experiments.</div> : 
             experiments.map(exp => (
               <Link 
                 href={`/experiments/${exp.id}`} 
                 key={exp.id} 
                 className="block bg-[#050505] border border-[#1a1a1a] rounded hover:border-white/10 transition-colors p-5 relative overflow-hidden group"
               >
                  <div className="absolute top-0 right-0 p-5 opacity-0 group-hover:opacity-100 transition-opacity">
                     <span className="text-[10px] uppercase font-bold text-white/50 group-hover:text-white transition-colors">Enter Protocol →</span>
                  </div>

                  <div className="flex items-center gap-3 mb-3">
                     <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${STATUS_COLORS[exp.status]}`}>
                        {exp.status}
                     </span>
                     <span className="text-[10px] text-white/20">{exp.id}</span>
                  </div>
                  
                  <h3 className="text-white font-bold text-lg mb-2">{exp.title}</h3>
                  <p className="text-white/40 text-[11px] leading-relaxed mb-4">{exp.hypothesis}</p>
                  
                  <div className="flex items-center gap-6 pt-4 border-t border-[#1a1a1a]">
                     <div className="flex items-center gap-2 text-[10px]">
                        <Target className="h-3 w-3 text-emerald-500" />
                        <span className="text-white uppercase font-bold tracking-widest">{exp.success_metric.replace('_', ' ')}</span>
                     </div>
                     <div className="flex items-center gap-2 text-[10px]">
                        <Clock className="h-3 w-3 text-white/30" />
                        <span className="text-white/40 uppercase">Started {exp.started_at ? formatDistanceToNow(new Date(exp.started_at)) + ' ago' : 'N/A'}</span>
                     </div>
                     <div className="flex items-center gap-2 text-[10px]">
                        <span className="text-white/40 uppercase"><span className="text-white font-bold">{exp.experiment_variants?.length || 0}</span> Variants</span>
                     </div>
                  </div>
               </Link>
             ))
            }
         </div>

         {/* Meta sidebar */}
         <div className="space-y-6">
            <div className="bg-amber-500/5 border border-amber-500/20 p-5 rounded">
               <h4 className="text-amber-500 font-bold uppercase text-[10px] flex items-center gap-2 mb-3">
                  <ShieldAlert className="h-3.5 w-3.5" /> Guardrails Active
               </h4>
               <p className="text-[10px] text-white/40 leading-relaxed">
                 Running experiments are dynamically monitored against Cost and SLA constraints. A breach will trigger an automatic pause or rollback without human intervention.
               </p>
            </div>
            
            <div>
               <div className="text-[10px] uppercase font-bold tracking-widest text-white/30 mb-3 block">Experiment Rules</div>
               <ul className="text-[10px] text-white/50 space-y-2 list-square pl-4 font-mono">
                  <li>Holdout groups are MANDATORY (min 5%).</li>
                  <li>No UI overrides on checkout until Q3.</li>
                  <li>Rollback plans must be explicit.</li>
               </ul>
            </div>
         </div>
      </div>
    </div>
  );
}
