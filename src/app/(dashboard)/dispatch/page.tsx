'use client';

import { useState, useMemo } from 'react';
import { useDispatch, manualAssign } from '@/hooks/useDispatch';
import { Truck, ShieldAlert, BarChart2, PauseCircle, Target, AlertTriangle, ChevronDown, RefreshCw } from 'lucide-react';
import { formatDistanceToNow } from 'date-fns';
import { toast } from 'sonner';

export default function DispatchPage() {
  const { unassignedOrders, partners, loading, error, refresh } = useDispatch();
  const [selectedOrder, setSelectedOrder] = useState<string | null>(null);
  const [pausedZones, setPausedZones] = useState<string[]>([]);

  const toggleZonePause = (zone: string) => {
    setPausedZones(prev =>
      prev.includes(zone) ? prev.filter(z => z !== zone) : [...prev, zone]
    );
  };

  const handleAssign = async (orderId: string, partnerId: string) => {
    try {
      await manualAssign(orderId, partnerId);
      toast.success('Assignment initiated');
      setSelectedOrder(null);
    } catch (err: any) {
      toast.error(`Assignment failed: ${err.message}`);
    }
  };

  const stats = useMemo(() => ([
    { label: 'Unassigned Orders', value: unassignedOrders.length, color: 'text-amber-400' },
    { label: 'Available Drivers', value: partners.filter(d => d.current_load < d.capacity).length, color: 'text-green-400' },
    { label: 'High Load Drivers', value: partners.filter(d => d.current_load >= d.capacity).length, color: 'text-red-400' },
    { label: 'Paused Zones', value: pausedZones.length, color: 'text-orange-400' },
    { label: 'Sync Status', value: loading ? 'SYNCING' : 'LIVE', color: loading ? 'text-white/20' : 'text-emerald-500' },
  ]), [unassignedOrders, partners, pausedZones, loading]);

  if (error) {
    return <div className="p-10 text-red-500 bg-black h-full font-mono">Error: {error}</div>;
  }

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-black font-mono text-[12px] text-[#888]">

      {/* Top Status Bar */}
      <div className="grid grid-cols-5 divide-x divide-[#1a1a1a] border-b border-[#1a1a1a]">
        {stats.map(stat => (
          <div key={stat.label} className="p-3">
            <div className="text-[10px] uppercase text-white/30">{stat.label}</div>
            <div className={`mt-1 text-xl font-medium ${stat.color}`}>{stat.value}</div>
          </div>
        ))}
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Left: Unassigned Queue */}
        <div className="flex w-[30%] flex-col border-r border-[#1a1a1a]">
          <div className="border-b border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 flex justify-between items-center">
            <span className="text-[10px] uppercase tracking-widest text-white/40">UNASSIGNED QUEUE</span>
            {loading && <RefreshCw className="h-3 w-3 animate-spin text-white/20" />}
          </div>
          <div className="flex-1 overflow-y-auto">
            {unassignedOrders.length === 0 ? (
              <div className="p-10 text-center text-white/10 uppercase tracking-widest">Queue Empty</div>
            ) : unassignedOrders.map(order => (
              <div
                key={order.id}
                onClick={() => setSelectedOrder(order.id)}
                className={`flex cursor-pointer items-center justify-between border-b border-[#1a1a1a]/50 px-4 py-3 transition-colors hover:bg-[#111] ${selectedOrder === order.id ? 'bg-[#151515] border-l-2 border-l-blue-500' : 'border-l-2 border-l-transparent'}`}
              >
                <div className="flex flex-col gap-1">
                  <span className="text-[11px] font-medium text-white">{order.id.substring(0,8)}...</span>
                  <span className="text-[10px] text-white/30">
                    {formatDistanceToNow(new Date(order.created_at))} ago
                  </span>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className="text-emerald-500">₹{order.total_amount}</span>
                  <span className="rounded bg-amber-500/10 px-1.5 py-0.5 text-[9px] uppercase text-amber-400">{order.status}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Center: Driver Grid */}
        <div className="flex flex-1 flex-col">
          <div className="border-b border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[10px] uppercase tracking-widest text-white/40">
            DRIVER ROSTER (ONLINE)
          </div>
          <div className="flex-1 overflow-y-auto">
            <div className="grid grid-cols-[1fr_120px_100px_140px] gap-4 border-b border-[#1a1a1a] bg-[#050505] px-4 py-2 text-[10px] uppercase text-white/30">
              <span>Driver</span>
              <span>Load</span>
              <span>Status</span>
              <span>Actions</span>
            </div>
            {partners.length === 0 ? (
              <div className="p-10 text-center text-white/10 uppercase tracking-widest">No active drivers</div>
            ) : partners.map(driver => {
              const isFull = driver.current_load >= driver.capacity;
              return (
                <div key={driver.id} className="grid grid-cols-[1fr_120px_100px_140px] items-center gap-4 border-b border-[#1a1a1a]/40 px-4 py-3 hover:bg-[#0a0a0a]">
                  <div className="flex flex-col min-w-0">
                    <span className="text-[11px] font-medium text-white truncate">{driver.name}</span>
                    <span className="text-[10px] text-white/30 font-mono">{driver.id.substring(0,8)}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="h-1 flex-1 rounded-full bg-[#1a1a1a]">
                      <div
                        className={`h-full rounded-full transition-all ${isFull ? 'bg-red-500' : driver.current_load > 0 ? 'bg-amber-500' : 'bg-green-500'}`}
                        style={{ width: `${(driver.current_load / driver.capacity) * 100}%` }}
                      />
                    </div>
                    <span className="text-[10px] text-white/40 tabular-nums">{driver.current_load}/{driver.capacity}</span>
                  </div>
                  <span className={`text-[10px] uppercase font-semibold ${isFull ? 'text-red-400' : 'text-green-400'}`}>
                    {isFull ? 'FULL' : 'AVAILABLE'}
                  </span>
                  <div className="flex gap-2">
                    {selectedOrder && !isFull && (
                      <button
                        onClick={() => handleAssign(selectedOrder, driver.id)}
                        className="rounded bg-blue-500/10 px-2 py-1 text-[10px] font-medium text-blue-400 hover:bg-blue-500/20 transition-colors"
                      >
                        <Target className="inline h-3 w-3 mr-1" />ASSIGN
                      </button>
                    )}
                    <button className="rounded bg-white/5 px-2 py-1 text-[10px] text-white/50 hover:bg-white/10 transition-colors">
                      MSG
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Right: Operational Controls */}
        <div className="flex w-64 flex-col border-l border-[#1a1a1a]">
          <div className="border-b border-[#1a1a1a] bg-[#0a0a0a] px-4 py-3 text-[10px] uppercase tracking-widest text-white/40">
            SYSTEM CONTROLS
          </div>
          <div className="flex flex-col gap-2 p-3">
             <div className="rounded border border-red-500/20 bg-red-950/10 p-3">
                <div className="flex items-center gap-2 text-red-400 mb-2">
                  <ShieldAlert className="h-4 w-4" />
                  <span className="text-[11px] font-bold">EMERGENCY PAUSE</span>
                </div>
                <p className="text-[10px] text-white/40 mb-3 leading-relaxed">Stop all automatic delivery assignments globally.</p>
                <button className="w-full bg-red-500/20 text-red-500 border border-red-500/20 py-2 rounded text-[10px] font-bold hover:bg-red-500/30 transition-all">
                  ACTIVATE 
                </button>
             </div>
             
             <div className="rounded border border-[#1a1a1a] bg-[#050505] p-3">
                <div className="flex items-center gap-2 text-amber-500 mb-2">
                  <BarChart2 className="h-4 w-4" />
                  <span className="text-[11px] font-bold">SMART SURGE</span>
                </div>
                <p className="text-[10px] text-white/40 mb-3 leading-relaxed">Dynamic multiplier currently at 1.0x. Auto-surge is DISBALED.</p>
                <button className="w-full bg-amber-500/10 text-amber-500 border border-amber-500/20 py-2 rounded text-[10px] font-bold hover:bg-amber-500/20 transition-all">
                  ENABLE AUTO-SURGE
                </button>
             </div>
          </div>

          <div className="mt-auto border-t border-[#1a1a1a] p-4 text-[10px] text-white/20 uppercase tracking-widest text-center">
            WEAZ LOGISTICS ENGINE v1.2
          </div>
        </div>

      </div>
    </div>
  );
}
