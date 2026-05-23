'use client';

import { useEffect, useState, useMemo } from 'react';
import { createClient } from '@/lib/supabase/client';
import { 
  BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, 
  AreaChart, Area, LineChart, Line, PieChart, Pie, Cell 
} from 'recharts';
import { 
  TrendingUp, ShoppingBag, Truck, Clock, 
  ArrowUpRight, ArrowDownRight, RefreshCw, Download 
} from 'lucide-react';
import { format, formatDistanceToNow } from 'date-fns';

export default function AnalyticsPage() {
  const supabase = createClient();
  const [salesData, setSalesData] = useState<any[]>([]);
  const [slaData, setSlaData] = useState<any[]>([]);
  const [funnelData, setFunnelData] = useState<any[]>([]);
  const [jobStatus, setJobStatus] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const [sales, sla, funnel, job] = await Promise.all([
        supabase.from('mv_daily_sales').select('*').order('day', { ascending: true }),
        supabase.from('mv_delivery_sla').select('*').order('day', { ascending: true }),
        supabase.from('mv_checkout_funnel').select('*').order('day', { ascending: true }),
        supabase.from('system_jobs').select('*').eq('id', 'analytics_refresh').single()
      ]);

      if (sales.data) setSalesData(sales.data);
      if (sla.data) setSlaData(sla.data);
      if (funnel.data) setFunnelData(funnel.data);
      if (job.data) setJobStatus(job.data);
      setLoading(false);
    }
    loadData();
  }, []);

  const totalGMV = useMemo(() => salesData.reduce((acc, curr) => acc + (curr.gmv || 0), 0), [salesData]);
  const totalOrders = useMemo(() => salesData.reduce((acc, curr) => acc + (curr.order_count || 0), 0), [salesData]);
  const avgSla = useMemo(() => slaData.length ? Math.round(slaData.reduce((acc, curr) => acc + (curr.avg_delivered_time_sec || 0), 0) / slaData.length / 60) : 0, [slaData]);

  const COLORS = ['#10b981', '#f43f5e', '#f59e0b', '#3b82f6'];

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-black overflow-y-auto font-mono text-[12px] text-[#888]">
      
      {/* Freshness Banner */}
      {jobStatus && (
        <div className="bg-[#10b981]/5 border-b border-[#10b981]/10 px-6 py-2 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="h-1.5 w-1.5 rounded-full bg-[#10b981] shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
             <span className="text-[10px] text-[#10b981]/80 font-bold uppercase tracking-widest">
               Data Synced {formatDistanceToNow(new Date(jobStatus.last_run_at), { addSuffix: true })}
             </span>
             <span className="text-[9px] text-white/20">Refreshed in {jobStatus.last_duration_ms}ms</span>
          </div>
          <p className="text-[9px] text-white/20 uppercase tracking-tighter">Operational aggregates may vary from live tables by up to 15m</p>
        </div>
      )}

      {/* Header Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#1a1a1a] border-b border-[#1a1a1a] bg-[#050505]">
        {[
          { label: 'Total Revenue', value: `₹${totalGMV.toLocaleString()}`, trend: '+12.5%', up: true, icon: TrendingUp },
          { label: 'Order Volume', value: totalOrders, trend: '+8.2%', up: true, icon: ShoppingBag },
          { label: 'Avg Delivery Time', value: `${avgSla}m`, trend: '-2.1m', up: true, icon: Clock },
          { label: 'SLA Achievement', value: '94.2%', trend: '-0.3%', up: false, icon: Truck },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="p-6">
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase text-white/30 tracking-widest">{stat.label}</span>
                <Icon className="h-4 w-4 text-white/20" />
              </div>
              <div className="flex items-end gap-3">
                <div className="text-2xl font-bold text-white leading-none">{loading ? '...' : stat.value}</div>
                <div className={`flex items-center text-[10px] pb-1 ${stat.up ? 'text-emerald-500' : 'text-red-500'}`}>
                  {stat.up ? <ArrowUpRight className="h-3 w-3 mr-0.5" /> : <ArrowDownRight className="h-3 w-3 mr-0.5" />}
                  {stat.trend}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="p-6 space-y-6">
        
        {/* Main Charts Row */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 h-auto md:h-[300px]">
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">Revenue Growth</span>
              <Download className="h-3.5 w-3.5 text-white/20 cursor-pointer hover:text-white/40" />
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={salesData}>
                  <defs>
                    <linearGradient id="colorGmv" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.1}/>
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis 
                    dataKey="day" 
                    hide 
                  />
                  <YAxis 
                    stroke="#333" 
                    fontSize={10} 
                    axisLine={false} 
                    tickLine={false}
                    tickFormatter={(val) => `₹${val/1000}k`}
                  />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #1a1a1a', fontSize: '10px', color: '#fff' }}
                    labelFormatter={(val) => format(new Date(val), 'MMM dd, yyyy')}
                  />
                  <Area type="monotone" dataKey="gmv" stroke="#10b981" fillOpacity={1} fill="url(#colorGmv)" strokeWidth={2} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 flex flex-col">
            <div className="flex items-center justify-between mb-6">
              <span className="text-[11px] font-bold text-white uppercase tracking-wider">Order Funnel (Conv. Rate)</span>
              <span className="text-[10px] text-emerald-500 font-bold">AVG 62%</span>
            </div>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={funnelData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="day" hide />
                  <YAxis stroke="#333" fontSize={10} axisLine={false} tickLine={false} tickFormatter={(val) => `${(val * 100).toFixed(0)}%`} />
                  <Tooltip 
                     contentStyle={{ backgroundColor: '#000', border: '1px solid #1a1a1a', fontSize: '10px' }}
                     labelFormatter={(val) => format(new Date(val), 'MMM dd, yyyy')}
                  />
                  <Line type="stepAfter" dataKey="conversion_rate" stroke="#3b82f6" strokeWidth={2} dot={false} activeDot={{ r: 4 }} />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Bottom Row */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 h-auto md:h-[260px]">
          
          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 flex flex-col">
            <span className="text-[10px] font-bold text-white/30 uppercase mb-4 tracking-widest">Delivery SLA Trend (p95)</span>
            <div className="flex-1 min-h-0">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={slaData}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#1a1a1a" vertical={false} />
                  <XAxis dataKey="day" hide />
                  <Tooltip 
                    contentStyle={{ backgroundColor: '#000', border: '1px solid #1a1a1a', fontSize: '10px' }}
                    cursor={{ fill: '#1a1a1a' }}
                    labelFormatter={(val) => format(new Date(val), 'MMM dd, yyyy')}
                  />
                  <Bar dataKey="p95_delivered_time_sec" fill="#f59e0b" radius={[2, 2, 0, 0]}>
                    {slaData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.p95_delivered_time_sec > 900 ? '#f43f5e' : '#f59e0b'} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>

          <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 col-span-2 overflow-hidden flex flex-col">
            <div className="flex items-center justify-between mb-4">
              <span className="text-[10px] font-bold text-white/30 uppercase tracking-widest">Operational Table</span>
              <button className="text-[9px] bg-white/5 border border-white/10 px-2 py-1 rounded text-white/60 hover:bg-white/10 transition-all">REFRESH AGGREGATES</button>
            </div>
            <div className="flex-1 overflow-y-auto">
               <table className="w-full text-left">
                  <thead className="text-[9px] uppercase text-white/10 border-b border-[#1a1a1a]">
                    <tr>
                      <th className="pb-2 font-medium">Date</th>
                      <th className="pb-2 font-medium text-right">Orders</th>
                      <th className="pb-2 font-medium text-right">Delivered</th>
                      <th className="pb-2 font-medium text-right">Volume</th>
                      <th className="pb-2 font-medium text-right">Avg SLA</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#1a1a1a]/50">
                    {salesData.reverse().slice(0, 5).map((row, i) => (
                      <tr key={i} className="hover:bg-white/[0.02] transition-colors">
                        <td className="py-3 text-white/70">{format(new Date(row.day), 'MMM dd')}</td>
                        <td className="py-3 text-right text-white font-medium">{row.order_count}</td>
                        <td className="py-3 text-right text-emerald-500">{row.delivered_count}</td>
                        <td className="py-3 text-right text-white/40">₹{row.gmv?.toLocaleString()}</td>
                        <td className="py-3 text-right text-amber-500">{Math.round(slaData.find(s => s.day === row.day)?.avg_delivered_time_sec / 60 || 0)}m</td>
                      </tr>
                    ))}
                  </tbody>
               </table>
            </div>
          </div>

        </div>

      </div>

      <div className="mt-auto border-t border-[#1a1a1a] bg-[#050505] px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-2">
           <RefreshCw className={`h-3 w-3 ${loading ? 'animate-spin' : ''} text-white/20`} />
           <span className="text-[10px] text-white/20">Data sourced from Materialized Views · Updates every 15m</span>
        </div>
        <div className="flex items-center gap-4">
           <span className="text-[10px] text-white/20">SYSTEM HEALTH: EXCELLENT</span>
           <div className="h-1.5 w-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
        </div>
      </div>

    </div>
  );
}
