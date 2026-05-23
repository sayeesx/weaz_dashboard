'use client';

import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { Receipt, TrendingUp, AlertTriangle, Activity, Package, Navigation, Zap, Search } from 'lucide-react';

export default function CostGovernancePage() {
  const [costs, setCosts] = useState<any[]>([]);
  const [metrics, setMetrics] = useState({
    costPerOrder: 0,
    costPerSearch: 0,
    costPerDriverCalc: 0,
    hourlyRunRate: 0,
    dailyForecast: 0
  });
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadCosts() {
      setLoading(true);
      const { data } = await supabase
        .from('cost_events')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(100); // Simplification for UI

      if (data) {
        setCosts(data);
        
        // Calculate dynamic averages based on latest sample window
        const totalSearchCost = data.filter(d => d.event_type.includes('search_api')).reduce((sum, d) => sum + Number(d.estimated_cost), 0);
        const totalSearchCount = data.filter(d => d.event_type.includes('search_api')).length || 1;
        
        const totalOrderCost = data.filter(d => d.event_type === 'checkout').reduce((sum, d) => sum + Number(d.estimated_cost), 0);
        const totalOrderCount = data.filter(d => d.event_type === 'checkout').length || 1;

        const totalDispatchCost = data.filter(d => d.event_type === 'dispatch_calc').reduce((sum, d) => sum + Number(d.estimated_cost), 0);
        const totalDispatchCount = data.filter(d => d.event_type === 'dispatch_calc').length || 1;

        const sumTotal = data.reduce((sum, d) => sum + Number(d.estimated_cost), 0);

        setMetrics({
           costPerSearch: totalSearchCost / totalSearchCount,
           costPerOrder: totalOrderCost / totalOrderCount,
           costPerDriverCalc: totalDispatchCost / totalDispatchCount,
           hourlyRunRate: sumTotal * 60, // Extrapolating a mock window for dashboard
           dailyForecast: sumTotal * 60 * 24
        });
      }
      setLoading(false);
    }
    loadCosts();
  }, []);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-black font-mono text-[12px] text-[#888] overflow-y-auto">
      
      <div className="p-8 border-b border-[#1a1a1a] bg-[#050505] flex items-center justify-between">
         <div>
           <div className="flex items-center gap-2 mb-1">
             <Receipt className="h-4 w-4 text-emerald-500" />
             <h1 className="text-white text-xl font-bold uppercase tracking-tight">Platform Cost Governance</h1>
           </div>
           <p className="text-white/30 text-[10px]">Realtime compute, external API, and infrastructure spend metrics.</p>
         </div>
         <div className="flex items-center gap-6">
            <div className="flex flex-col text-right">
               <span className="text-[9px] uppercase text-white/30">Current Base Run Rate</span>
               <span className="text-xl font-bold text-white tabular-nums">${metrics.hourlyRunRate.toFixed(4)} <span className="text-[12px] text-white/40">/hr</span></span>
            </div>
         </div>
      </div>

      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#1a1a1a] border-b border-[#1a1a1a] bg-[#030303]">
        {[
          { label: 'Avg Cost / Order', value: `$${metrics.costPerOrder.toFixed(5)}`, icon: Package, color: 'text-emerald-500' },
          { label: 'Avg Cost / Search', value: `$${metrics.costPerSearch.toFixed(5)}`, icon: Search, color: 'text-blue-500' },
          { label: 'Avg Cost / Dispatch', value: `$${metrics.costPerDriverCalc.toFixed(5)}`, icon: Navigation, color: 'text-amber-500' },
          { label: 'Cloud Egress Forecast', value: `$${metrics.dailyForecast.toFixed(2)}`, icon: Activity, color: 'text-purple-500' },
        ].map(stat => (
          <div key={stat.label} className="p-4 md:p-6 border-[#1a1a1a] md:border-t-0 [&:nth-child(even)]:border-l">
            <div className="flex items-center gap-2 text-[10px] uppercase text-white/30 mb-2 font-bold tracking-widest">
               <stat.icon className="h-3 w-3" /> {stat.label}
            </div>
            <div className={`text-xl md:text-2xl font-bold tracking-tight tabular-nums ${stat.color}`}>{loading ? '...' : stat.value}</div>
          </div>
        ))}
      </div>

      <div className="flex-1 flex flex-col xl:grid xl:grid-cols-[1fr_350px] xl:divide-x divide-[#1a1a1a] min-h-0">
         <div className="p-4 md:p-8 min-w-0 flex flex-col">
            <h3 className="text-white uppercase font-bold tracking-widest text-[10px] mb-6 flex items-center gap-2 shrink-0">
               <Zap className="h-3 w-3 text-amber-500" /> Live Event Trace Stream (100)
            </h3>
            
            <div className="space-y-2 overflow-x-auto min-h-0 flex-1">
                <div className="min-w-[600px] grid grid-cols-[120px_1fr_100px_80px_120px] px-4 py-2 text-[9px] uppercase font-bold text-white/20 border-b border-[#1a1a1a]">
                   <span>Provider</span>
                   <span>Event Type</span>
                   <span className="text-right">Duration</span>
                   <span className="text-right">Cost (USD)</span>
                   <span className="text-right">Dimensions</span>
                </div>
               <div className="min-w-[600px] space-y-2 pb-4">
                 {loading ? (
                   <div className="p-4 text-center text-white/20">Loading cost telemetry...</div>
                 ) : costs.map(cost => (
                   <div key={cost.id} className="grid grid-cols-[120px_1fr_100px_80px_120px] px-4 py-3 bg-[#0a0a0a] border border-[#1a1a1a] rounded hover:border-white/10 transition-colors items-center">
                      <span className="text-white/40 uppercase text-[9px]">{cost.provider.replace('supabase_', '')}</span>
                      <span className="text-white font-medium capitalize truncate">{cost.event_type.replace('_', ' ')}</span>
                      <span className="text-amber-500 text-right tabular-nums">{cost.duration_ms}ms</span>
                      <span className="text-emerald-500 text-right font-bold tabular-nums">${Number(cost.estimated_cost).toFixed(5)}</span>
                      <span className="text-right flex justify-end">
                         {cost.dimensions?.feature_flag ? (
                           <span className="bg-purple-500/10 text-purple-400 border border-purple-500/20 px-1.5 py-0.5 rounded text-[9px] uppercase">
                              FLAG: {cost.dimensions.feature_flag}
                           </span>
                         ) : <span className="text-white/10">-</span>}
                      </span>
                   </div>
                 ))}
               </div>
            </div>
         </div>

         <div className="bg-[#050505] p-4 md:p-6 space-y-6 shrink-0 border-t xl:border-t-0 border-[#1a1a1a]">
            <div className="bg-amber-500/5 border border-amber-500/10 rounded-lg p-5">
               <div className="flex items-center gap-2 text-amber-500 font-bold uppercase text-[10px] mb-2">
                  <AlertTriangle className="h-3.5 w-3.5" /> High-Cost Feature Warning
               </div>
               <p className="text-[10px] text-white/40 leading-relaxed mb-4">
                  The <span className="text-white">MapBox Geocoding</span> implementation is driving up base Dispatch calculation costs. Recommend reducing update frequency.
               </p>
               <div className="flex justify-between items-end border-t border-amber-500/10 pt-3">
                  <span className="text-amber-500/50 uppercase text-[9px] font-bold">Relative Delta</span>
                  <span className="text-amber-500 font-bold tracking-tight">+18.4% WoW</span>
               </div>
            </div>

            <div>
               <div className="text-[10px] uppercase font-bold tracking-widest text-white/30 mb-3">Top Expensive Flags</div>
               <div className="space-y-3">
                  <div className="bg-[#0a0a0a] p-3 rounded border border-red-500/20 border-l-2 border-l-red-500">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-white font-medium text-[11px]">live_map_sync</span>
                        <span className="text-red-500 tabular-nums">48%</span>
                     </div>
                     <div className="h-1 w-full bg-red-500/10 rounded-full overflow-hidden">
                        <div className="h-full bg-red-500 w-[48%]" />
                     </div>
                  </div>
                  <div className="bg-[#0a0a0a] p-3 rounded border border-amber-500/20 border-l-2 border-l-amber-500">
                     <div className="flex justify-between items-center mb-1">
                        <span className="text-white font-medium text-[11px]">search_v2</span>
                        <span className="text-amber-500 tabular-nums">24%</span>
                     </div>
                     <div className="h-1 w-full bg-amber-500/10 rounded-full overflow-hidden">
                        <div className="h-full bg-amber-500 w-[24%]" />
                     </div>
                  </div>
               </div>
            </div>
         </div>
      </div>
    </div>
  );
}
