'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { LibraryBig, Calendar, GitCommit } from 'lucide-react';
import { format } from 'date-fns';

export default function DecisionLogPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function fetchLogs() {
      setLoading(true);
      const { data } = await supabase.from('decision_log').select('*, author:auth.users(email)').order('created_at', { ascending: false });
      if (data) setLogs(data);
      setLoading(false);
    }
    fetchLogs();
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-black overflow-y-auto font-mono text-[12px] text-[#888]">
      
      <div className="p-8 border-b border-[#1a1a1a] bg-[#050505] flex items-center justify-between">
         <div>
           <div className="flex items-center gap-2 mb-1">
             <LibraryBig className="h-4 w-4 text-emerald-500" />
             <h1 className="text-white text-xl font-bold uppercase tracking-tight">Architectural Decision Log</h1>
           </div>
           <p className="text-white/30 text-[10px]">Immutable record of contextual logic behind platform shifts and rollbacks.</p>
         </div>
         <button className="bg-white/5 border border-white/10 text-white px-4 py-2 rounded font-bold uppercase text-[10px] hover:bg-white/10">
            Append Entry
         </button>
      </div>

      <div className="p-8 max-w-4xl mx-auto w-full">
         
         <div className="space-y-6 before:absolute before:left-[43px] before:top-[160px] before:bottom-0 before:w-px before:bg-white/5 relative">
            {loading ? <div className="text-white/20 pl-8">Syncing chronology...</div> : 
             logs.length === 0 ? <div className="text-white/20 pl-8">No decisions recorded in state.</div> : 
             logs.map(log => (
               <div key={log.id} className="relative pl-8">
                  <div className="absolute left-[3px] top-4 h-2 w-2 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)] z-10" />
                  
                  <div className="bg-[#050505] border border-[#1a1a1a] p-6 rounded-lg hover:border-white/10 transition-colors">
                     
                     <div className="flex items-start justify-between mb-4 pb-4 border-b border-[#1a1a1a]">
                        <h3 className="text-white text-lg font-bold">{log.title}</h3>
                        <div className="flex items-center gap-4 text-[10px] uppercase text-white/40 font-bold">
                           <span className="flex items-center gap-1.5"><Calendar className="h-3 w-3" /> {format(new Date(log.created_at), 'PPP')}</span>
                           <span className="flex items-center gap-1.5"><GitCommit className="h-3 w-3" /> {log.author?.email || 'System'}</span>
                        </div>
                     </div>

                     <div className="grid grid-cols-2 gap-8">
                        <div>
                           <span className="block text-[9px] uppercase tracking-widest text-[#888] font-bold mb-2">Context / Precedent</span>
                           <p className="text-white/60 leading-relaxed text-[11px]">{log.context}</p>
                        </div>
                        <div>
                           <span className="block text-[9px] uppercase tracking-widest text-emerald-500 font-bold mb-2">Resolution / Decision</span>
                           <p className="text-white leading-relaxed text-[11px]">{log.decision}</p>
                        </div>
                     </div>

                  </div>
               </div>
             ))
            }
         </div>
      </div>
    </div>
  );
}
