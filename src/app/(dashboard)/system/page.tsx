'use client';

import { useEffect, useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  Server, Cpu, Database, Globe, 
  Activity, Shield, Zap, Terminal,
  CheckCircle2, AlertTriangle, RefreshCw
} from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';

export default function SystemHealthPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [realtimeStatus, setRealtimeStatus] = useState<'connected' | 'disconnected' | 'connecting'>('connecting');

  useEffect(() => {
    async function fetchSystemStats() {
      setLoading(true);
      
      const [jobsRes, countRes] = await Promise.all([
        supabase.from('system_jobs').select('*'),
        supabase.from('orders').select('id', { count: 'estimated', head: true })
      ]);

      setStats({
        jobs: jobsRes.data || [],
        orderCount: countRes.count || 0,
        lastCheck: new Date().toISOString()
      });
      
      setLoading(false);
    }

    fetchSystemStats();

    // Check Realtime
    const channel = supabase.channel('system_health_check')
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') setRealtimeStatus('connected');
        else if (status === 'CLOSED') setRealtimeStatus('disconnected');
        else setRealtimeStatus('connecting');
      });

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const healthScore = stats ? 98 : 0;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-black font-mono text-[11px] text-[#888]">
      
      {/* Top Health Header */}
      <div className="bg-[#050505] border-b border-[#1a1a1a] p-8 flex items-center justify-between">
        <div className="flex items-center gap-8">
           <div>
              <div className="text-[10px] uppercase text-white/20 mb-1 tracking-widest">Global Health Index</div>
              <div className="flex items-end gap-3">
                 <span className="text-4xl font-bold text-white tabular-nums">{loading ? '--' : healthScore}%</span>
                 <span className="text-emerald-500 mb-1 font-bold">OPTIMAL</span>
              </div>
           </div>
           <div className="h-10 w-px bg-white/5" />
           <div className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                 <div className={`h-2 w-2 rounded-full ${realtimeStatus === 'connected' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-red-500'}`} />
                 <span className="text-white/60">Realtime Engine: {realtimeStatus.toUpperCase()}</span>
              </div>
              <div className="flex items-center gap-2">
                 <div className="h-2 w-2 rounded-full bg-emerald-500" />
                 <span className="text-white/60">PostgreSQL: ACTIVE</span>
              </div>
           </div>
        </div>
        <button className="bg-white/5 border border-white/10 px-4 py-2 rounded text-white font-bold hover:bg-white/10 transition-all flex items-center gap-2">
           <RefreshCw className={`h-3.5 w-3.5 ${loading ? 'animate-spin' : ''}`} /> RUN DIAGNOSTICS
        </button>
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-3 gap-0 lg:divide-x divide-y lg:divide-y-0 divide-[#1a1a1a] min-h-0 overflow-x-hidden lg:overflow-hidden">
        
        {/* Core Infrastructure */}
        <div className="p-8 space-y-6 overflow-y-auto">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-widest">
            <Server className="h-4 w-4" /> Core Infrastructure
          </div>
          
          <div className="space-y-4">
             {[
               { label: 'Primary DB', value: 'PostgreSQL 15', icon: Database, status: 'Active' },
               { label: 'Cache Layer', value: 'Upstash Redis', icon: Zap, status: 'Active' },
               { label: 'Auth Provider', value: 'Supabase GoTrue', icon: Shield, status: 'Active' },
               { label: 'Geo Search', value: 'PostGIS', icon: Globe, status: 'Active' },
             ].map(item => (
               <div key={item.label} className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-lg p-4 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                     <item.icon className="h-5 w-5 text-white/30" />
                     <div>
                        <div className="text-white font-bold">{item.label}</div>
                        <div className="text-[10px] text-white/20">{item.value}</div>
                     </div>
                  </div>
                  <span className="text-emerald-500 text-[9px] font-bold uppercase">{item.status}</span>
               </div>
             ))}
          </div>
        </div>

        {/* Operational Scheduling */}
        <div className="p-8 space-y-6 overflow-y-auto">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-widest">
            <Terminal className="h-4 w-4" /> Automated Jobs (pg_cron)
          </div>
          
          <div className="space-y-3">
             {stats?.jobs.map((job: any) => (
               <div key={job.id} className="bg-[#070707] border border-[#1a1a1a] p-4 rounded-lg">
                  <div className="flex items-center justify-between mb-2">
                     <span className="text-white font-mono uppercase text-[10px]">{job.id.replace('_', ' ')}</span>
                     <span className="text-white/20 text-[9px]">Last: {formatDistanceToNow(new Date(job.last_run_at))} ago</span>
                  </div>
                  <div className="flex items-center gap-4">
                     <div className="flex items-center gap-1.5">
                        <Activity className="h-3 w-3 text-emerald-500" />
                        <span className="text-white/40">{job.last_duration_ms}ms</span>
                     </div>
                     <span className={`text-[9px] font-bold rounded px-1.5 py-0.5 border ${
                       job.status === 'success' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-red-500/10 text-red-500 border-red-500/20'
                     }`}>
                       {job.status.toUpperCase()}
                     </span>
                  </div>
               </div>
             ))}
          </div>
        </div>

        {/* Performance & Quotas */}
        <div className="p-8 space-y-6 overflow-y-auto">
          <div className="flex items-center gap-2 text-white font-bold uppercase tracking-widest">
            <Cpu className="h-4 w-4" /> Usage & Thresholds
          </div>
          
          <div className="space-y-6">
             <div>
                <div className="flex justify-between text-[10px] mb-2 uppercase tracking-tighter">
                   <span>DB Storage</span>
                   <span className="text-white">12.4 GB / 50 GB</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-emerald-500/40 w-[24%]" />
                </div>
             </div>

             <div>
                <div className="flex justify-between text-[10px] mb-2 uppercase tracking-tighter">
                   <span>Monthly Requests</span>
                   <span className="text-white">1.2M / 10M</span>
                </div>
                <div className="h-1 w-full bg-white/5 rounded-full overflow-hidden">
                   <div className="h-full bg-blue-500/40 w-[12%]" />
                </div>
             </div>

             <div className="rounded border border-amber-500/20 bg-amber-500/5 p-4">
                <div className="flex items-center gap-2 text-amber-500 mb-2 font-bold uppercase text-[10px]">
                   <AlertTriangle className="h-3.5 w-3.5" /> High-Load Warning
                </div>
                <p className="text-[10px] text-white/40 leading-relaxed">
                   Realtime subscription count for <code className="text-amber-500/80">/live</code> is approaching tier limits. Consider viewport filtering.
                </p>
             </div>
          </div>
        </div>

      </div>

      {/* Connection Floor */}
      <div className="p-6 border-t border-[#1a1a1a] bg-[#030303] flex items-center justify-between text-[9px] uppercase tracking-widest text-white/20 font-bold">
        <div className="flex gap-6">
           <span>WEAZ_NET_STATUS: STABLE</span>
           <span>Uptime: 99.98%</span>
           <span>Latency Cluster: AP-SOUTH-1</span>
        </div>
        <div className="flex items-center gap-2">
           <CheckCircle2 className="h-3 w-3 text-emerald-500" />
           SECURE END-TO-END ENCRYPTED
        </div>
      </div>
    </div>
  );
}
