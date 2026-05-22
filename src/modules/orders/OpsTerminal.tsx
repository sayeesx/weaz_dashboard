'use client';

import { useEffect, useMemo, useState, useCallback } from 'react';
import { useOrders, fetchOrderHistory, fetchOrderDetail } from '@/hooks/useOrders';
import type { OrderHistoryEntry } from '@/hooks/useOrders';
import { Virtuoso } from 'react-virtuoso';
import { formatDistanceToNow, format } from 'date-fns';
import { Search, MapPin, Package, Clock, Truck, ShieldAlert, RefreshCw, Filter } from 'lucide-react';
import { supabase } from '@/lib/supabase/client';
import { toast } from 'sonner';

const STATUS_COLORS: Record<string, string> = {
  pending:         'text-gray-400 bg-gray-500/10',
  created:         'text-gray-400 bg-gray-500/10',
  reserved:        'text-amber-400 bg-amber-500/10',
  payment_pending: 'text-orange-400 bg-orange-500/10',
  paid:            'text-emerald-400 bg-emerald-500/10',
  assigning:       'text-cyan-400 bg-cyan-500/10',
  assigned:        'text-blue-400 bg-blue-500/10',
  confirmed:       'text-sky-400 bg-sky-500/10',
  picked_up:       'text-purple-400 bg-purple-500/10',
  on_the_way:      'text-violet-400 bg-violet-500/10',
  arrived:         'text-indigo-400 bg-indigo-500/10',
  delivered:       'text-green-400 bg-green-500/10',
  cancelled:       'text-red-400 bg-red-500/10',
  failed:          'text-red-500 bg-red-600/10',
};

const TIMELINE_COLOR: Record<string, string> = {
  pending: 'bg-gray-500',
  reserved: 'bg-amber-500',
  payment_pending: 'bg-orange-500',
  paid: 'bg-emerald-500',
  assigning: 'bg-cyan-500',
  assigned: 'bg-blue-500',
  confirmed: 'bg-sky-500',
  picked_up: 'bg-purple-500',
  on_the_way: 'bg-violet-500',
  delivered: 'bg-green-500',
  cancelled: 'bg-red-500',
  failed: 'bg-red-600',
};

const STATUS_FILTERS = ['all', 'pending', 'reserved', 'payment_pending', 'assigning', 'assigned', 'picked_up', 'delivered', 'cancelled', 'failed'];

export function OpsTerminal() {
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [windowMinutes, setWindowMinutes] = useState(120);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [history, setHistory] = useState<OrderHistoryEntry[]>([]);
  const [detail, setDetail] = useState<{ items: any[]; assignment: any } | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<'timeline' | 'items' | 'assignment'>('timeline');

  const { orders, loading, error } = useOrders({ statusFilter, windowMinutes });

  // Load order detail when selection changes
  useEffect(() => {
    if (!selectedId) return;
    setDetailLoading(true);
    setHistory([]);
    setDetail(null);

    Promise.all([
      fetchOrderHistory(selectedId),
      fetchOrderDetail(selectedId),
    ]).then(([hist, det]) => {
      setHistory(hist);
      setDetail(det);
    }).catch(console.error).finally(() => setDetailLoading(false));
  }, [selectedId]);

  const filteredOrders = useMemo(() => {
    if (!search) return orders;
    const q = search.toLowerCase();
    return orders.filter(o =>
      o.id.toLowerCase().includes(q) ||
      o.status.toLowerCase().includes(q) ||
      o.user_id?.toLowerCase().includes(q)
    );
  }, [orders, search]);

  const selectedOrder = useMemo(() => orders.find(o => o.id === selectedId), [orders, selectedId]);

  // Unassigned count for KPI
  const unassigned = useMemo(() => orders.filter(o => ['paid', 'assigning'].includes(o.status)).length, [orders]);
  const avgAge = useMemo(() => {
    if (!orders.length) return '—';
    const ages = orders.map(o => Date.now() - new Date(o.created_at).getTime());
    const avgMs = ages.reduce((a, b) => a + b, 0) / ages.length;
    return `${Math.round(avgMs / 60_000)}m`;
  }, [orders]);

  const forceCancel = useCallback(async (id: string) => {
    const { data: userRes } = await supabase.auth.getUser();
    const userId = userRes.user?.id;
    if (!userId) { toast.error('Not authenticated'); return; }

    const { error } = await supabase.rpc('order_transition', {
      p_order_id: id,
      p_new_status: 'cancelled',
      p_user_id: userId,
      p_notes: 'Force cancelled from Ops Terminal',
    });

    if (error) toast.error(`Transition blocked: ${error.message}`);
    else toast.success('Order cancelled via state machine');
  }, []);

  return (
    <div className="flex h-[calc(100vh-4rem)] w-full flex-col overflow-hidden bg-black text-[#878787] font-mono text-[12px]">

      {/* KPI Bar */}
      <div className="grid grid-cols-5 divide-x divide-[#1a1a1a] border-b border-[#1a1a1a]">
        <div className="p-3">
          <div className="text-[10px] uppercase text-white/30">Active Queue</div>
          <div className="mt-1 text-xl font-medium text-white">{filteredOrders.length} <span className="text-[10px] text-white/30">orders</span></div>
        </div>
        <div className="p-3">
          <div className="text-[10px] uppercase text-white/30">Needs Assignment</div>
          <div className={`mt-1 text-xl font-medium ${unassigned > 0 ? 'text-amber-400' : 'text-white/30'}`}>{unassigned}</div>
        </div>
        <div className="p-3">
          <div className="text-[10px] uppercase text-white/30">Avg Order Age</div>
          <div className="mt-1 text-xl font-medium text-blue-400">{avgAge}</div>
        </div>
        <div className="p-3">
          <div className="text-[10px] uppercase text-white/30">Window</div>
          <div className="mt-1 flex items-center gap-2">
            {[60, 120, 360, 720].map(m => (
              <button
                key={m}
                onClick={() => setWindowMinutes(m)}
                className={`rounded px-1.5 py-0.5 text-[9px] uppercase transition-colors ${windowMinutes === m ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}
              >
                {m < 60 ? `${m}m` : `${m / 60}h`}
              </button>
            ))}
          </div>
        </div>
        <div className="flex items-center justify-between p-3">
          <div>
            <div className="text-[10px] uppercase text-white/30">Stream</div>
            <div className="mt-1 text-[11px] font-medium text-emerald-500">{loading ? 'SYNCING…' : error ? 'ERROR' : 'LIVE'}</div>
          </div>
          <div className="relative flex h-2.5 w-2.5">
            {!loading && !error && (
              <><span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" /><span className="relative inline-flex h-2.5 w-2.5 rounded-full bg-emerald-500" /></>
            )}
          </div>
        </div>
      </div>

      {/* Status Filter Tabs */}
      <div className="flex items-center gap-1 border-b border-[#1a1a1a] bg-[#030303] px-4 py-1.5 overflow-x-auto">
        <Filter className="h-3 w-3 text-white/20 mr-1 flex-shrink-0" />
        {STATUS_FILTERS.map(s => {
          const active = (s === 'all' && !statusFilter) || statusFilter === s;
          return (
            <button
              key={s}
              onClick={() => setStatusFilter(s === 'all' ? undefined : s)}
              className={`flex-shrink-0 rounded px-2.5 py-1 text-[10px] uppercase transition-colors ${active ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}
            >
              {s}
            </button>
          );
        })}
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Left: Live Queue */}
        <div className="flex w-[44%] flex-col border-r border-[#1a1a1a]">
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-[#1a1a1a] bg-[#0a0a0a] px-4 py-2.5">
            <Search className="h-3.5 w-3.5 text-white/30 flex-shrink-0" />
            <input
              type="text"
              placeholder="Search order ID, user…"
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-white/20"
            />
            {filteredOrders.length !== orders.length && (
              <span className="text-[10px] text-white/30">{filteredOrders.length}/{orders.length}</span>
            )}
          </div>

          {/* Column headers */}
          <div className="grid grid-cols-[60px_1fr_100px_70px] gap-3 border-b border-[#1a1a1a] bg-[#030303] px-4 py-1.5 text-[10px] uppercase tracking-wider text-white/30">
            <span>Age</span>
            <span>Order ID</span>
            <span>Status</span>
            <span className="text-right">₹</span>
          </div>

          {/* Virtualised rows */}
          <div className="flex-1 bg-[#020202]">
            {loading ? (
              <div className="flex items-center gap-2 p-4 text-white/20">
                <RefreshCw className="h-3 w-3 animate-spin" /> Syncing ledger…
              </div>
            ) : error ? (
              <div className="p-4 text-red-500/60">Error: {error}</div>
            ) : filteredOrders.length === 0 ? (
              <div className="p-4 text-white/20">No orders in this window.</div>
            ) : (
              <Virtuoso
                data={filteredOrders}
                itemContent={(_i, order) => {
                  const isSelected = selectedId === order.id;
                  const sc = STATUS_COLORS[order.status] ?? 'text-gray-400 bg-gray-500/10';
                  return (
                    <div
                      onClick={() => setSelectedId(order.id)}
                      className={`grid cursor-pointer grid-cols-[60px_1fr_100px_70px] gap-3 items-center border-b border-[#1a1a1a]/50 px-4 py-2.5 transition-colors hover:bg-[#111] ${isSelected ? 'bg-[#151515] border-l-2 border-l-white' : 'border-l-2 border-l-transparent'}`}
                    >
                      <span className="text-[10px] text-white/30 tabular-nums">
                        {formatDistanceToNow(new Date(order.created_at), { addSuffix: false })}
                      </span>
                      <span className="truncate font-medium text-[#c0c0c0] text-[11px]" title={order.id}>
                        {order.id.substring(0, 8)}…
                      </span>
                      <div>
                        <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${sc}`}>
                          {order.status.replace(/_/g, ' ')}
                        </span>
                      </div>
                      <span className="text-right text-[11px] text-emerald-500/90 tabular-nums">
                        {order.final_amount ?? order.total_amount}
                      </span>
                    </div>
                  );
                }}
              />
            )}
          </div>
        </div>

        {/* Right: Inspector */}
        <div className="flex flex-1 flex-col bg-[#050505]">
          {selectedOrder ? (
            <>
              {/* Header */}
              <div className="flex items-start justify-between border-b border-[#1a1a1a] bg-[#0a0a0a] px-5 py-4">
                <div>
                  <h2 className="text-[13px] font-semibold text-white">INSPECTOR</h2>
                  <p className="mt-0.5 font-mono text-[10px] text-white/30">{selectedOrder.id}</p>
                </div>
                <span className={`rounded px-2.5 py-1 text-[10px] font-bold uppercase ${STATUS_COLORS[selectedOrder.status] ?? 'text-white bg-white/10'}`}>
                  {selectedOrder.status.replace(/_/g, ' ')}
                </span>
              </div>

              {/* Action bar */}
              <div className="flex items-center gap-2 border-b border-[#1a1a1a] bg-[#020202] px-3 py-2">
                <button
                  onClick={() => forceCancel(selectedOrder.id)}
                  disabled={['cancelled', 'delivered', 'failed'].includes(selectedOrder.status)}
                  className="flex items-center gap-1.5 rounded bg-red-500/10 px-3 py-1.5 text-[11px] font-medium text-red-500 transition-colors hover:bg-red-500/20 disabled:opacity-30 disabled:cursor-not-allowed"
                >
                  <ShieldAlert className="h-3 w-3" /> FORCE CANCEL
                </button>
                <button className="flex items-center gap-1.5 rounded bg-white/5 px-3 py-1.5 text-[11px] text-white/60 transition-colors hover:bg-white/10">
                  <Truck className="h-3 w-3" /> MANUAL DISPATCH
                </button>
              </div>

              {/* Tabs */}
              <div className="flex border-b border-[#1a1a1a] bg-[#030303]">
                {(['timeline', 'items', 'assignment'] as const).map(tab => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`px-4 py-2.5 text-[10px] uppercase tracking-wider transition-colors border-b-2 ${activeTab === tab ? 'border-white text-white' : 'border-transparent text-white/30 hover:text-white/60'}`}
                  >
                    {tab}
                  </button>
                ))}
              </div>

              {/* Tab content */}
              <div className="flex-1 overflow-y-auto p-5">
                {detailLoading ? (
                  <div className="flex items-center gap-2 text-white/20">
                    <RefreshCw className="h-3 w-3 animate-spin" /> Loading…
                  </div>
                ) : (
                  <>
                    {/* Meta always visible */}
                    <div className="mb-5 grid grid-cols-2 gap-3">
                      <div className="rounded border border-[#1a1a1a] bg-black p-3">
                        <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase text-white/30"><Clock className="h-3 w-3" /> Timestamps</div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between"><span className="text-white/40">Created</span><span className="text-[#c0c0c0] tabular-nums">{format(new Date(selectedOrder.created_at), 'HH:mm:ss')}</span></div>
                          <div className="flex justify-between"><span className="text-white/40">Updated</span><span className="text-[#c0c0c0] tabular-nums">{format(new Date(selectedOrder.updated_at), 'HH:mm:ss')}</span></div>
                          <div className="flex justify-between"><span className="text-white/40">Age</span><span className="text-[#c0c0c0]">{formatDistanceToNow(new Date(selectedOrder.created_at))}</span></div>
                        </div>
                      </div>
                      <div className="rounded border border-[#1a1a1a] bg-black p-3">
                        <div className="mb-2 flex items-center gap-1.5 text-[10px] uppercase text-white/30"><MapPin className="h-3 w-3" /> Financials</div>
                        <div className="space-y-1.5">
                          <div className="flex justify-between"><span className="text-white/40">Total</span><span className="text-[#c0c0c0]">₹{selectedOrder.total_amount}</span></div>
                          <div className="flex justify-between"><span className="text-white/40">Final</span><span className="text-emerald-400 font-semibold">₹{selectedOrder.final_amount ?? selectedOrder.total_amount}</span></div>
                        </div>
                      </div>
                    </div>

                    {/* TIMELINE TAB */}
                    {activeTab === 'timeline' && (
                      <div className="rounded border border-[#1a1a1a] bg-black p-4">
                        <div className="mb-4 text-[10px] uppercase text-white/30">State Machine History</div>
                        {history.length === 0 ? (
                          <p className="text-[11px] text-white/20">No transitions recorded.</p>
                        ) : (
                          <div className="relative space-y-4 before:absolute before:inset-0 before:ml-[9px] before:h-full before:w-0.5 before:bg-[#1a1a1a]">
                            {history.map((entry, i) => (
                              <div key={entry.id} className="relative flex items-start gap-4">
                                <div className={`relative z-10 mt-0.5 h-5 w-5 flex-shrink-0 rounded-full border-2 border-black flex items-center justify-center ${TIMELINE_COLOR[entry.status] ?? 'bg-gray-600'}`}>
                                  <span className="text-[8px] font-bold text-white">{i + 1}</span>
                                </div>
                                <div className="flex-1 min-w-0">
                                  <div className="flex items-center justify-between gap-2">
                                    <span className={`inline-flex rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${STATUS_COLORS[entry.status] ?? 'text-gray-400 bg-gray-500/10'}`}>
                                      {entry.status.replace(/_/g, ' ')}
                                    </span>
                                    <span className="flex-shrink-0 text-[10px] text-white/30 tabular-nums">{format(new Date(entry.created_at), 'HH:mm:ss')}</span>
                                  </div>
                                  {entry.notes && <p className="mt-1 text-[10px] text-white/40 truncate">{entry.notes}</p>}
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}

                    {/* ITEMS TAB */}
                    {activeTab === 'items' && (
                      <div className="rounded border border-[#1a1a1a] bg-black">
                        <div className="border-b border-[#1a1a1a] px-4 py-2 text-[10px] uppercase text-white/30">Order Items</div>
                        {!detail?.items.length ? (
                          <p className="p-4 text-[11px] text-white/20">No items loaded.</p>
                        ) : (
                          detail.items.map((item: any) => (
                            <div key={item.id} className="flex items-center justify-between border-b border-[#1a1a1a]/50 px-4 py-2.5 last:border-0">
                              <div>
                                <span className="text-[11px] text-white/60 font-mono">{item.product_id?.substring(0, 12)}…</span>
                                <span className="ml-3 text-[10px] text-white/30">×{item.quantity}</span>
                              </div>
                              <span className="text-emerald-500 tabular-nums">₹{item.price_at_time}</span>
                            </div>
                          ))
                        )}
                      </div>
                    )}

                    {/* ASSIGNMENT TAB */}
                    {activeTab === 'assignment' && (
                      <div className="rounded border border-[#1a1a1a] bg-black p-4">
                        <div className="mb-3 text-[10px] uppercase text-white/30">Delivery Assignment</div>
                        {!detail?.assignment ? (
                          <p className="text-[11px] text-white/20">No partner assigned yet.</p>
                        ) : (
                          <div className="space-y-2">
                            {[
                              { label: 'Partner ID', value: detail.assignment.partner_id?.substring(0, 12) + '…' },
                              { label: 'Status', value: detail.assignment.status },
                              { label: 'Assigned At', value: detail.assignment.assigned_at ? format(new Date(detail.assignment.assigned_at), 'HH:mm:ss') : '—' },
                              { label: 'Completed At', value: detail.assignment.completed_at ? format(new Date(detail.assignment.completed_at), 'HH:mm:ss') : 'In Progress' },
                            ].map(row => (
                              <div key={row.label} className="flex justify-between border-b border-[#1a1a1a]/40 py-1.5 last:border-0">
                                <span className="text-white/40">{row.label}</span>
                                <span className="text-[#c0c0c0] font-mono">{row.value}</span>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    )}
                  </>
                )}
              </div>
            </>
          ) : (
            <div className="flex h-full items-center justify-center flex-col gap-3 text-white/15">
              <Package className="h-10 w-10 stroke-[0.75]" />
              <span className="text-[10px] uppercase tracking-widest">Select an order to inspect</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
