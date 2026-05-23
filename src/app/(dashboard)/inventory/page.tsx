'use client';

import { useMemo, useState } from 'react';
import { useInventory } from '@/hooks/useInventory';
import type { LiveInventoryItem } from '@/hooks/useInventory';
import { Warehouse, AlertTriangle, TrendingDown, Package, Search, ArrowUpDown, RefreshCw } from 'lucide-react';

type StockLevel = 'ok' | 'low' | 'critical' | 'out';

function getStockLevel(item: LiveInventoryItem): StockLevel {
  if (item.available_qty === 0) return 'out';
  const ratio = item.available_qty / item.total_qty;
  if (ratio < 0.05) return 'critical';
  if (ratio < 0.20) return 'low';
  return 'ok';
}

const STOCK_STYLES: Record<StockLevel, { bar: string; badge: string; label: string }> = {
  ok:       { bar: 'bg-green-500',  badge: 'text-green-400 bg-green-500/10',   label: 'OK' },
  low:      { bar: 'bg-amber-500',  badge: 'text-amber-400 bg-amber-500/10',   label: 'LOW' },
  critical: { bar: 'bg-orange-500', badge: 'text-orange-400 bg-orange-500/10', label: 'CRITICAL' },
  out:      { bar: 'bg-red-500',    badge: 'text-red-400 bg-red-500/10',        label: 'OUT' },
};

// Heat badge for reservation pressure: reserved / total
function PressureBadge({ pressure }: { pressure: number }) {
  const pct = Math.round(pressure * 100);
  const color = pressure > 0.5 ? 'text-red-400 bg-red-500/10' : pressure > 0.2 ? 'text-amber-400 bg-amber-500/10' : 'text-white/30 bg-white/5';
  return (
    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold tabular-nums ${color}`}>
      {pct}%
    </span>
  );
}

export default function InventoryPage() {
  const { items, loading, error } = useInventory();
  const [search, setSearch] = useState('');
  const [filterLevel, setFilterLevel] = useState<StockLevel | 'all'>('all');
  const [selected, setSelected] = useState<LiveInventoryItem | null>(null);

  const filtered = useMemo(() => {
    return items.filter(item => {
      const lv = getStockLevel(item);
      const matchLevel = filterLevel === 'all' || lv === filterLevel;
      const q = search.toLowerCase();
      const matchSearch = !q ||
        item.product_name?.toLowerCase().includes(q) ||
        item.product_sku?.toLowerCase().includes(q) ||
        item.warehouse_name?.toLowerCase().includes(q);
      return matchLevel && matchSearch;
    });
  }, [items, search, filterLevel]);

  const counts = useMemo(() => ({
    ok:       items.filter(i => getStockLevel(i) === 'ok').length,
    low:      items.filter(i => getStockLevel(i) === 'low').length,
    critical: items.filter(i => getStockLevel(i) === 'critical').length,
    out:      items.filter(i => getStockLevel(i) === 'out').length,
  }), [items]);

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-black font-mono text-[12px] text-[#888]">

      {/* KPIs */}
      <div className="grid grid-cols-2 md:grid-cols-4 divide-y md:divide-y-0 md:divide-x divide-[#1a1a1a] border-b border-[#1a1a1a]">
        {[
          { label: 'In Stock',     value: counts.ok,       color: 'text-green-400',  icon: Package },
          { label: 'Low Stock',    value: counts.low,      color: 'text-amber-400',  icon: TrendingDown },
          { label: 'Critical',     value: counts.critical, color: 'text-orange-400', icon: AlertTriangle },
          { label: 'Out of Stock', value: counts.out,      color: 'text-red-400',    icon: Warehouse },
        ].map(stat => {
          const Icon = stat.icon;
          return (
            <div key={stat.label} className="flex items-center justify-between p-4">
              <div>
                <div className="text-[10px] uppercase text-white/30">{stat.label}</div>
                <div className={`mt-1 text-2xl font-medium ${stat.color}`}>
                  {loading ? <RefreshCw className="h-4 w-4 animate-spin inline" /> : stat.value}
                </div>
              </div>
              <Icon className={`h-8 w-8 opacity-20 ${stat.color}`} />
            </div>
          );
        })}
      </div>

      {/* Filter + Search */}
      <div className="flex items-center gap-4 border-b border-[#1a1a1a] bg-[#050505] px-4 py-2.5">
        <div className="flex flex-1 items-center gap-2">
          <Search className="h-3.5 w-3.5 text-white/30" />
          <input
            type="text"
            placeholder="Search SKU, product, warehouse…"
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="flex-1 bg-transparent text-[11px] text-white outline-none placeholder:text-white/20"
          />
        </div>
        <div className="flex items-center gap-1">
          {(['all', 'ok', 'low', 'critical', 'out'] as const).map(level => (
            <button
              key={level}
              onClick={() => setFilterLevel(level)}
              className={`rounded px-2.5 py-1 text-[10px] uppercase transition-colors ${filterLevel === level ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}
            >
              {level}
            </button>
          ))}
        </div>
        <div className="flex items-center gap-1.5 border-l border-[#1a1a1a] pl-3">
          <div className={`h-2 w-2 rounded-full ${loading ? 'bg-amber-500 animate-pulse' : error ? 'bg-red-500' : 'bg-green-500'}`} />
          <span className="text-[10px] text-white/30">{loading ? 'SYNCING' : error ? 'ERROR' : 'LIVE'}</span>
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Table */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <div className="grid grid-cols-[90px_1fr_90px_60px_60px_60px_70px_80px_70px] items-center gap-3 border-b border-[#1a1a1a] bg-[#030303] px-5 py-2 text-[10px] uppercase text-white/30">
            <span>SKU</span>
            <span>Product</span>
            <span>Warehouse</span>
            <span className="text-right">Total</span>
            <span className="text-right">Resv.</span>
            <span className="text-right">Avail.</span>
            <span className="text-center">Pressure</span>
            <span className="text-center">Cover</span>
            <span className="text-center">Status</span>
          </div>

          <div className="flex-1 overflow-y-auto">
            {error ? (
              <div className="p-4 text-red-500/60">{error}</div>
            ) : filtered.map(item => {
              const lv = getStockLevel(item);
              const style = STOCK_STYLES[lv];
              const fillPct = item.total_qty > 0 ? (item.available_qty / item.total_qty) * 100 : 0;
              const isSelected = selected?.product_id === item.product_id && selected?.warehouse_id === item.warehouse_id;

              return (
                <div
                  key={`${item.product_id}-${item.warehouse_id}`}
                  onClick={() => setSelected(item)}
                  className={`grid cursor-pointer grid-cols-[90px_1fr_90px_60px_60px_60px_70px_80px_70px] items-center gap-3 border-b border-[#1a1a1a]/40 px-5 py-2.5 transition-all hover:bg-[#0a0a0a] ${isSelected ? 'bg-[#111] border-l-2 border-l-white' : 'border-l-2 border-l-transparent'}`}
                >
                  <span className="text-[10px] text-white/40 truncate">{item.product_sku}</span>
                  <div className="min-w-0">
                    <div className="truncate text-[11px] text-white">{item.product_name}</div>
                  </div>
                  <span className="truncate text-[10px] text-white/40">{item.warehouse_name}</span>
                  <span className="text-right tabular-nums text-white/50">{item.total_qty}</span>
                  <span className="text-right tabular-nums text-amber-400/70">{item.reserved_qty}</span>
                  <div className="flex items-center justify-end gap-1.5">
                    <div className="h-1 w-8 rounded-full bg-[#1a1a1a]">
                      <div className={`h-full rounded-full ${style.bar}`} style={{ width: `${Math.max(fillPct, 2)}%` }} />
                    </div>
                    <span className={`text-[11px] font-semibold tabular-nums ${item.available_qty === 0 ? 'text-red-400' : 'text-white'}`}>
                      {item.available_qty}
                    </span>
                  </div>
                  <div className="flex justify-center">
                    <PressureBadge pressure={item.reservation_pressure} />
                  </div>
                  <div className="text-center text-[10px]">
                    {item.days_of_cover !== null ? (
                      <span className={item.days_of_cover <= 3 ? 'text-red-400' : item.days_of_cover <= 7 ? 'text-amber-400' : 'text-white/40'}>
                        {item.days_of_cover}d
                      </span>
                    ) : <span className="text-white/20">—</span>}
                  </div>
                  <div className="flex justify-center">
                    <span className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${style.badge}`}>{style.label}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Detail Panel */}
        {selected && (
          <div className="flex w-72 flex-col border-l border-[#1a1a1a] bg-[#050505]">
            <div className="border-b border-[#1a1a1a] bg-[#0a0a0a] p-4">
              <p className="text-[10px] uppercase text-white/30">{selected.product_sku}</p>
              <h2 className="mt-1 text-[13px] font-semibold leading-tight text-white">{selected.product_name}</h2>
              <p className="mt-0.5 text-[10px] text-white/40">{selected.warehouse_name}</p>
            </div>

            <div className="flex flex-col gap-3 overflow-y-auto p-4">
              {/* Ledger */}
              <div className="rounded border border-[#1a1a1a] bg-black p-3">
                <div className="mb-2 text-[10px] uppercase text-white/30">Stock Ledger</div>
                {[
                  { label: 'Total',      value: selected.total_qty,     color: 'text-white' },
                  { label: 'Reserved',   value: selected.reserved_qty,  color: 'text-amber-400' },
                  { label: 'Sold',       value: selected.sold_qty,      color: 'text-white/40' },
                  { label: 'Available',  value: selected.available_qty, color: selected.available_qty === 0 ? 'text-red-400' : 'text-green-400' },
                ].map(row => (
                  <div key={row.label} className="flex items-center justify-between border-b border-[#1a1a1a]/50 py-1.5 last:border-0">
                    <span className="text-[10px] text-white/40">{row.label}</span>
                    <span className={`tabular-nums font-semibold ${row.color}`}>{row.value}</span>
                  </div>
                ))}
              </div>

              {/* Pressure + Cover */}
              <div className="rounded border border-[#1a1a1a] bg-black p-3">
                <div className="mb-2 text-[10px] uppercase text-white/30">Risk Metrics</div>
                <div className="flex items-center justify-between py-1 border-b border-[#1a1a1a]/50">
                  <span className="text-[10px] text-white/40">Reservation Pressure</span>
                  <PressureBadge pressure={selected.reservation_pressure} />
                </div>
                <div className="flex items-center justify-between py-1">
                  <span className="text-[10px] text-white/40">Days of Cover</span>
                  <span className={`text-[11px] font-semibold ${
                    selected.days_of_cover === null ? 'text-white/20' :
                    selected.days_of_cover <= 3 ? 'text-red-400' :
                    selected.days_of_cover <= 7 ? 'text-amber-400' : 'text-green-400'
                  }`}>
                    {selected.days_of_cover !== null ? `${selected.days_of_cover}d` : '—'}
                  </span>
                </div>
              </div>

              {/* Fill Rate Bar */}
              <div className="rounded border border-[#1a1a1a] bg-black p-3">
                <div className="mb-2 flex items-center justify-between text-[10px]">
                  <span className="uppercase text-white/30">Fill Rate</span>
                  <span className="text-white">{selected.total_qty > 0 ? ((selected.available_qty / selected.total_qty) * 100).toFixed(0) : 0}%</span>
                </div>
                <div className="h-1.5 w-full rounded-full bg-[#1a1a1a]">
                  <div
                    className={`h-full rounded-full transition-all ${STOCK_STYLES[getStockLevel(selected)].bar}`}
                    style={{ width: `${selected.total_qty > 0 ? (selected.available_qty / selected.total_qty) * 100 : 0}%` }}
                  />
                </div>
              </div>

              {/* Admin Actions */}
              <div className="flex flex-col gap-2 pt-1">
                <button className="flex w-full items-center justify-center rounded bg-white/5 py-2 text-[11px] text-white/70 hover:bg-white/10 transition-colors">
                  MANUAL ADJUST
                </button>
                <button className="flex w-full items-center justify-center rounded bg-white/5 py-2 text-[11px] text-white/70 hover:bg-white/10 transition-colors">
                  TRANSFER STOCK
                </button>
                <button className="flex w-full items-center justify-center rounded bg-amber-500/10 py-2 text-[11px] font-medium text-amber-400 hover:bg-amber-500/20 transition-colors">
                  REQUEST RESTOCK
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
