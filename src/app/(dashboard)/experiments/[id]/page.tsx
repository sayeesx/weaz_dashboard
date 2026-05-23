'use client';

import { useParams, useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  ChevronLeft, TestTube, Target, ShieldAlert,
  ArrowUpRight, ArrowDownRight, Activity, Clock
} from 'lucide-react';

export default function ExperimentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  
  const [exp, setExp] = useState<any>(null);
  const [variants, setVariants] = useState<any[]>([]);
  const [metrics, setMetrics] = useState<any[]>([]);
  const [guardrails, setGuardrails] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  const supabase = createClient();

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [expRes, varRes, metRes, guardRes] = await Promise.all([
         supabase.from('experiments').select('*').eq('id', id).single(),
         supabase.from('experiment_variants').select('*').eq('experiment_id', id).order('is_control', { ascending: false }),
         supabase.from('experiment_metrics').select('*').eq('experiment_id', id),
         supabase.from('experiment_guardrails').select('*').eq('experiment_id', id)
      ]);
      
      if (expRes.data) setExp(expRes.data);
      if (varRes.data) setVariants(varRes.data);
      if (metRes.data) setMetrics(metRes.data);
      if (guardRes.data) setGuardrails(guardRes.data);
      
      setLoading(false);
    }
    load();
  }, [id]);

  if (loading) return <div className="p-20 text-white/50 uppercase tracking-widest font-mono text-center">Decrypting experiment data...</div>;
  if (!exp) return <div className="p-20 text-red-500 font-mono">Experiment not found.</div>;

  return (
    <div className="min-h-[calc(100vh-4rem)] flex flex-col bg-black text-[#888] font-mono text-[12px]">
      
      {/* Header */}
      <div className="border-b border-[#1a1a1a] bg-[#050505] p-8 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded transition-colors border border-transparent hover:border-white/10">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-white/30 uppercase text-[10px] tracking-widest">{exp.id}</span>
              <span className={`px-2 py-0.5 rounded text-[9px] font-bold uppercase border ${exp.status === 'running' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-white/10 text-white border-white/20'}`}>
                {exp.status}
              </span>
            </div>
            <h1 className="text-2xl font-bold text-white tracking-tight">{exp.title}</h1>
          </div>
        </div>
        <div className="flex gap-2">
            <button className="border border-white/10 px-4 py-2 text-white font-bold uppercase rounded hover:bg-white/5 transition-all text-[10px]">
               Force Rollback
            </button>
            {exp.status === 'running' && (
              <button className="bg-amber-500/10 border border-amber-500/20 px-4 py-2 text-amber-500 font-bold uppercase rounded hover:bg-amber-500/20 transition-all text-[10px]">
                 Pause Evaluation
              </button>
            )}
        </div>
      </div>

      <div className="flex-1 p-8 grid grid-cols-[1fr_350px] gap-8">
         <div className="space-y-8">
            
            {/* Hypothesis */}
            <div className="bg-[#050505] border border-[#1a1a1a] p-6 rounded-lg">
               <div className="text-[10px] uppercase font-bold tracking-widest text-white/30 mb-2">Experimental Context</div>
               <p className="text-white/80 leading-relaxed text-[13px]">{exp.hypothesis}</p>
               
               <div className="mt-6 flex items-center gap-8 border-t border-[#1a1a1a] pt-4">
                  <div>
                     <span className="block text-[9px] uppercase text-white/30 mb-1">Success Metric</span>
                     <div className="flex items-center gap-1.5 text-emerald-500 font-bold">
                        <Target className="h-3.5 w-3.5" />
                        <span className="uppercase">{exp.success_metric.replace(/_/g, ' ')}</span>
                     </div>
                  </div>
                  <div>
                     <span className="block text-[9px] uppercase text-white/30 mb-1">Rollback Plan</span>
                     <span className="text-white/80">{exp.rollback_plan}</span>
                  </div>
               </div>
            </div>

            {/* Variants Matrix */}
            <div>
               <div className="text-[10px] uppercase font-bold tracking-widest text-white/30 mb-3 flex items-center gap-2">
                  <TestTube className="h-4 w-4" /> Active Variants & Lift
               </div>
               
               <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {variants.map(v => {
                     const m = metrics.find(mx => mx.variant_id === v.id && mx.metric_name === exp.success_metric);
                     // Very naive mock lift calculation against the control (assuming index 0 is control since we ordered)
                     const controlM = metrics.find(mx => mx.variant_id === variants[0].id && mx.metric_name === exp.success_metric);
                     
                     let lift = 0;
                     if (m && controlM && !v.is_control) {
                        lift = ((m.value - controlM.value) / controlM.value) * 100;
                        if (exp.success_metric.includes('breach') || exp.success_metric.includes('cost')) {
                           lift = -lift; // Lower is better
                        }
                     }

                     return (
                       <div key={v.id} className={`p-5 rounded-lg border ${v.is_control ? 'bg-blue-500/5 border-blue-500/20' : v.is_holdout ? 'bg-[#0a0a0a] border-[#1a1a1a]' : 'bg-emerald-500/5 border-emerald-500/20'}`}>
                          <div className="flex items-center justify-between mb-4">
                             <span className="text-white font-bold">{v.name}</span>
                             <span className="bg-white/5 px-2 py-0.5 rounded text-[9px] font-bold text-white/40">{v.allocation_pct}%</span>
                          </div>
                          
                          <div className="space-y-4">
                             <div>
                                <div className="text-[9px] uppercase text-white/30 tracking-widest mb-1">Observation Value</div>
                                <div className="text-2xl font-bold tracking-tight text-white tabular-nums">
                                   {m ? m.value : '0.00'}{exp.success_metric.includes('rate') ? '%' : ''}
                                </div>
                             </div>
                             
                             {!v.is_control && !v.is_holdout && m && (
                                <div className={`flex items-center gap-1.5 text-[11px] font-bold ${lift > 0 ? 'text-emerald-500' : 'text-red-500'}`}>
                                   {lift > 0 ? <ArrowUpRight className="h-3 w-3" /> : <ArrowDownRight className="h-3 w-3" />}
                                   <span className="uppercase">{Math.abs(lift).toFixed(1)}% Lift vs Control</span>
                                </div>
                             )}
                             {v.is_control && <div className="text-[9px] text-blue-500/60 uppercase font-bold tracking-widest">Baseline Scenario</div>}
                             {v.is_holdout && <div className="text-[9px] text-white/30 uppercase font-bold tracking-widest">Zero-Intervention Baseline</div>}

                             <div className="pt-3 border-t border-white/5">
                                <span className="text-white/40 text-[9px] uppercase">Sample Size: {m ? m.sample_size : 0} interactions</span>
                             </div>
                          </div>
                       </div>
                     )
                  })}
               </div>
            </div>

         </div>

         {/* Guardrails Dashboard */}
         <div className="flex flex-col gap-6">
            
            <div className="bg-red-500/5 border border-red-500/20 rounded-lg p-5">
               <div className="flex items-center gap-2 mb-4">
                  <ShieldAlert className="h-4 w-4 text-red-500" />
                  <span className="text-red-500 font-bold uppercase text-[10px] tracking-widest">Risk Guardrails</span>
               </div>
               
               <div className="space-y-4">
                  {guardrails.length === 0 ? (
                     <div className="text-white/20 text-[9px]">No automatic guardrails configured. HIGH RISK.</div>
                  ) : guardrails.map(g => (
                     <div key={g.id} className="bg-black/50 p-3 border border-red-500/10 rounded">
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-white font-mono text-[9px] uppercase">{g.metric}</span>
                           <span className="text-white/40 text-[10px] font-bold">{g.threshold_operator} {g.threshold_value}</span>
                        </div>
                        <div className="flex justify-between items-center text-[9px] font-bold uppercase">
                           <span className="text-white/20">Action on Breach</span>
                           <span className={g.action === 'rollback' ? 'text-red-500' : 'text-amber-500'}>{g.action}</span>
                        </div>
                     </div>
                  ))}
               </div>
            </div>

         </div>
      </div>
    </div>
  );
}
