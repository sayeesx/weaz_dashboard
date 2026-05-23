'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Flag, Play, Target, UserCheck, CheckCircle2, XCircle, Plus } from 'lucide-react';
import { toast } from 'sonner';

export default function FlagsPage() {
  const [flags, setFlags] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadFlags() {
      setLoading(true);
      const { data } = await supabase.from('flags').select('*, flag_rollouts(*)').order('created_at', { ascending: false });
      if (data) setFlags(data);
      setLoading(false);
    }
    loadFlags();
  }, []);

  const toggleFlag = async (id: string, current: boolean) => {
    try {
      const { error } = await supabase.from('flags').update({ is_enabled: !current }).eq('id', id);
      if (error) throw error;
      setFlags(flags.map(f => f.id === id ? { ...f, is_enabled: !current } : f));
      toast.success(`Flag ${id} ${!current ? 'ENABLED' : 'DISABLED'}`);
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-black overflow-y-auto font-mono text-[12px] text-[#888]">
      
      <div className="p-8 border-b border-[#1a1a1a] bg-[#050505] flex items-center justify-between">
         <div>
           <div className="flex items-center gap-2 mb-1">
             <Flag className="h-4 w-4 text-emerald-500" />
             <h1 className="text-white text-xl font-bold uppercase tracking-tight">Feature Flags & Rollouts</h1>
           </div>
           <p className="text-white/30 text-[10px]">Safely deploy architecture changes without code releases.</p>
         </div>
         <button className="bg-white text-black px-4 py-2 rounded font-bold uppercase text-[10px] flex items-center gap-2 hover:bg-white/90">
            <Plus className="h-3 w-3" /> New Flag
         </button>
      </div>

      <div className="p-8 space-y-6">
         {loading ? (
           <div className="text-white/20 animate-pulse">Loading flags...</div>
         ) : flags.length === 0 ? (
           <div className="text-white/20">No feature flags registered in the system.</div>
         ) : (
           <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6">
              {flags.map((flag) => {
                 const rollouts = flag.flag_rollouts || [];
                 const activeRollout = rollouts[0]; // Simplification for UI

                 return (
                   <div key={flag.id} className="bg-[#050505] border border-[#1a1a1a] rounded-lg p-6 flex flex-col hover:border-white/10 transition-colors">
                      <div className="flex items-start justify-between mb-4">
                         <div>
                            <h3 className="text-white font-bold text-lg mb-1">{flag.name}</h3>
                            <div className="text-[10px] text-white/30 uppercase tracking-widest">{flag.id}</div>
                         </div>
                         
                         {/* Toggle Switch */}
                         <button 
                           onClick={() => toggleFlag(flag.id, flag.is_enabled)}
                           className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                              flag.is_enabled ? 'bg-emerald-500' : 'bg-[#1a1a1a]'
                           }`}
                         >
                            <span 
                              className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                                 flag.is_enabled ? 'translate-x-6' : 'translate-x-1'
                              }`} 
                            />
                         </button>
                      </div>

                      <p className="text-[#888] leading-relaxed mb-6 flex-1">
                         {flag.description}
                      </p>

                      <div className="bg-black/50 rounded border border-[#1a1a1a] p-4 text-[10px]">
                         <div className="uppercase font-bold text-white/20 mb-3 tracking-widest">Active Rollout Rules</div>
                         
                         {activeRollout ? (
                            <div className="space-y-3">
                               <div className="flex items-center justify-between">
                                  <div className="flex items-center gap-2 text-white/60">
                                     <Play className="h-3 w-3" /> Percentage Group
                                  </div>
                                  <span className="text-white font-bold">{activeRollout.percentage}%</span>
                               </div>
                               {activeRollout.target_roles?.length > 0 && (
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-white/60">
                                       <UserCheck className="h-3 w-3" /> Target Roles
                                    </div>
                                    <span className="text-amber-500 uppercase font-bold">{activeRollout.target_roles.join(', ')}</span>
                                 </div>
                               )}
                               {activeRollout.target_regions?.length > 0 && (
                                 <div className="flex items-center justify-between">
                                    <div className="flex items-center gap-2 text-white/60">
                                       <Target className="h-3 w-3" /> Target Regions
                                    </div>
                                    <span className="text-blue-500 uppercase font-bold">{activeRollout.target_regions.join(', ')}</span>
                                 </div>
                               )}
                            </div>
                         ) : (
                            <div className="text-white/20 italic">No targeted rollouts configured. This flag affects 100% of traffic when enabled.</div>
                         )}
                      </div>
                   </div>
                 );
              })}
           </div>
         )}
      </div>

    </div>
  );
}
