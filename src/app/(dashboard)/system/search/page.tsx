'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Search, Database, Clock, RefreshCw, Activity, ArrowRight, Zap, Target } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';

export default function SearchGovernancePage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [latency, setLatency] = useState(0);
  const [jobs, setJobs] = useState<any[]>([]);
  const [suggestions, setSuggestions] = useState<any[]>([]);
  const supabase = createClient();

  useEffect(() => {
    async function fetchMeta() {
      // Fetch cron job logs roughly for search index
      const { data } = await supabase
         .from('system_jobs')
         .select('*')
         .in('id', ['refresh-search-index', 'refresh-search-suggestions']);
      
      const { data: suggs } = await supabase
         .from('search_suggestions')
         .select('*')
         .order('score', { ascending: false })
         .limit(5);

      if (data) setJobs(data);
      if (suggs) setSuggestions(suggs);
    }
    fetchMeta();
  }, []);

  const handleTestSearch = async () => {
    if (!query) return;
    setLoading(true);
    const start = performance.now();
    
    // Simulate caching wrapper
    const { data, error } = await supabase.rpc('search_products', {
      p_query: query,
      p_limit: 10
    });
    
    setLatency(performance.now() - start);
    
    if (error) {
       toast.error(error.message);
    } else {
       setResults(data || []);
    }
    setLoading(false);
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-black font-mono text-[12px] text-[#888]">
      
      <div className="p-8 border-b border-[#1a1a1a] bg-[#050505] flex items-center justify-between">
         <div>
           <div className="flex items-center gap-2 mb-1">
             <Database className="h-4 w-4 text-emerald-500" />
             <h1 className="text-white text-xl font-bold uppercase tracking-tight">Search Engine Console</h1>
           </div>
           <p className="text-white/30 text-[10px]">Governance, projections, and query performance testing.</p>
         </div>
         <div className="flex gap-4">
            {jobs.map(job => (
              <div key={job.id} className="bg-[#0a0a0a] border border-[#1a1a1a] px-4 py-2 rounded flex flex-col">
                 <span className="text-[9px] uppercase text-white/30">{job.id.replace('refresh-', '')}</span>
                 <div className="flex items-center gap-2 text-white mt-1">
                    <Clock className="h-3 w-3 text-emerald-500" />
                    <span>{job.last_run_at ? formatDistanceToNow(new Date(job.last_run_at), { addSuffix: true }) : 'Never'}</span>
                 </div>
              </div>
            ))}
         </div>
      </div>

      <div className="flex-1 flex flex-col md:grid md:grid-cols-2 lg:grid-cols-[55%_45%] xl:grid-cols-2 md:divide-x divide-y md:divide-y-0 divide-[#1a1a1a] overflow-x-hidden md:overflow-hidden min-h-0">
        
        {/* Left: Test Console */}
        <div className="flex flex-col">
           <div className="p-6 border-b border-[#1a1a1a] bg-[#0a0a0a]">
              <span className="text-[10px] uppercase font-bold tracking-widest text-white/40 block mb-4">Live Query Tester</span>
              <div className="flex gap-2 relative">
                 <div className="absolute left-3 top-1/2 -translate-y-1/2">
                    <Search className="h-4 w-4 text-white/20" />
                 </div>
                 <input 
                   type="text"
                   placeholder="Try 'milk' or 'bread'..."
                   value={query}
                   onChange={(e) => setQuery(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && handleTestSearch()}
                   className="w-full bg-black border border-[#1a1a1a] rounded px-10 py-3 text-white focus:outline-none focus:border-white/20 transition-all font-mono"
                 />
                 <button 
                   onClick={handleTestSearch}
                   disabled={loading}
                   className="bg-white text-black px-6 rounded font-bold uppercase tracking-wider hover:bg-white/90 disabled:opacity-50 transition-all flex items-center gap-2"
                 >
                   {loading ? <RefreshCw className="h-4 w-4 animate-spin" /> : 'Execute'}
                 </button>
              </div>
              {latency > 0 && (
                <div className="flex items-center gap-4 mt-3 text-[10px]">
                   <span className="text-white/40">Query Latency:</span>
                   <span className={latency < 50 ? 'text-emerald-500' : latency < 150 ? 'text-amber-500' : 'text-red-500'}>
                     {Math.round(latency)}ms
                   </span>
                   <span className="text-white/40 mx-2">|</span>
                   <span className="text-white/40">Results: <span className="text-white">{results.length}</span></span>
                </div>
              )}
           </div>

           <div className="flex-1 overflow-y-auto bg-black p-0">
             {results.length === 0 ? (
                <div className="flex flex-col items-center justify-center p-20 text-white/10">
                   <Target className="h-10 w-10 mb-4 stroke-1" />
                   <p className="uppercase tracking-[0.2em]">Run a query to view projection results</p>
                </div>
             ) : (
                <div className="divide-y divide-[#1a1a1a]">
                  {results.map((r, i) => (
                    <div key={i} className="p-4 hover:bg-[#050505] transition-colors flex items-center justify-between">
                       <div>
                          <div className="flex items-center gap-2">
                            <span className="text-white font-medium">{r.title}</span>
                            <span className="bg-white/5 border border-white/10 text-[9px] px-1.5 py-0.5 rounded text-white/40 uppercase">{r.category}</span>
                          </div>
                          <div className="text-[10px] text-white/30 mt-1 font-mono">{r.product_id}</div>
                       </div>
                       <div className="flex items-center gap-6 text-right">
                          <div className="flex flex-col">
                             <span className="text-[9px] uppercase text-white/20">Availability</span>
                             <span className={r.availability > 0 ? "text-emerald-500" : "text-red-500"}>{r.availability > 0 ? r.availability : 'OOS'}</span>
                          </div>
                          <div className="flex flex-col">
                             <span className="text-[9px] uppercase text-white/20">Rank Score</span>
                             <span className="text-white font-bold">{Number(r.rank_score).toFixed(2)}</span>
                          </div>
                       </div>
                    </div>
                  ))}
                </div>
             )}
           </div>
        </div>

        {/* Right: Governance & Analytics */}
        <div className="flex flex-col">
           <div className="p-6 space-y-6">
              
              <div className="bg-[#050505] p-5 rounded-lg border border-[#1a1a1a] shadow-inner">
                 <div className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-4 flex items-center gap-2">
                    <Activity className="h-3 w-3" /> Topology Health
                 </div>
                 <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <div className="text-[9px] uppercase text-white/20">Trigram Index</div>
                      <div className="text-emerald-500 text-sm font-bold flex items-center gap-1.5"><Zap className="h-3 w-3" /> GIN Active</div>
                    </div>
                    <div className="space-y-1">
                      <div className="text-[9px] uppercase text-white/20">Materialized Search</div>
                      <div className="text-emerald-500 text-sm font-bold flex items-center gap-1.5"><Zap className="h-3 w-3" /> Cached</div>
                    </div>
                 </div>
              </div>

              <div>
                 <div className="text-[10px] uppercase font-bold tracking-widest text-white/40 mb-4 block">Hot Terms (Top 5 Suggestions)</div>
                 <div className="space-y-2">
                    {suggestions.length === 0 ? (
                       <div className="text-white/20 text-[10px] italic">Not enough search volume to aggregate suggestions yet.</div>
                    ) : suggestions.map(s => (
                       <div key={s.term} className="flex justify-between items-center p-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded">
                          <span className="text-white capitalize">{s.term}</span>
                          <div className="flex items-center gap-4 text-[10px]">
                             <span className="text-white/30">{s.frequency} queries</span>
                             <span className="bg-amber-500/10 text-amber-500 px-2 py-0.5 rounded font-bold">{Number(s.score).toFixed(1)}</span>
                          </div>
                       </div>
                    ))}
                 </div>
              </div>

           </div>
        </div>
        
      </div>
    </div>
  );
}
