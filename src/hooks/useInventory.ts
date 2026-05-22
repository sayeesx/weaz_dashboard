import { createClient } from '@/lib/supabase/client';
import { useEffect, useRef, useState, useCallback } from 'react';

export interface LiveInventoryItem {
  product_id: string;
  warehouse_id: string;
  total_qty: number;
  reserved_qty: number;
  sold_qty: number;
  available_qty: number;
  updated_at: string;
  // joined
  product_name?: string;
  product_sku?: string;
  warehouse_name?: string;
  // computed
  reservation_pressure: number; // reserved / total — heat
  days_of_cover: number | null;  // available / avg_daily_sold estimate
}

export function useInventory() {
  const supabase = createClient();
  const [items, setItems] = useState<LiveInventoryItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const computeItem = (row: any): LiveInventoryItem => {
    const reservationPressure = row.total_qty > 0 ? row.reserved_qty / row.total_qty : 0;
    // Estimate: assume 30-day sold history, compute avg daily sold
    const avgDailySold = row.sold_qty > 0 ? row.sold_qty / 30 : 0;
    const daysOfCover = avgDailySold > 0 ? Math.round(row.available_qty / avgDailySold) : null;

    return {
      product_id: row.product_id,
      warehouse_id: row.warehouse_id,
      total_qty: row.total_qty,
      reserved_qty: row.reserved_qty,
      sold_qty: row.sold_qty,
      available_qty: row.available_qty,
      updated_at: row.updated_at,
      product_name: row.products?.name ?? '—',
      product_sku: row.products?.sku ?? row.product_id.substring(0, 8),
      warehouse_name: row.warehouses?.name ?? row.warehouse_id.substring(0, 8),
      reservation_pressure: reservationPressure,
      days_of_cover: daysOfCover,
    };
  };

  const upsertItem = useCallback((incoming: any) => {
    const computed = computeItem(incoming);
    setItems(prev => {
      const idx = prev.findIndex(i => i.product_id === computed.product_id && i.warehouse_id === computed.warehouse_id);
      if (idx === -1) return [computed, ...prev];
      const next = [...prev];
      next[idx] = computed;
      return next;
    });
  }, []);

  useEffect(() => {
    const loadInitial = async () => {
      setLoading(true);
      const { data, error: err } = await supabase
        .from('product_inventory')
        .select(`
          product_id, warehouse_id, total_qty, reserved_qty, sold_qty, available_qty, updated_at,
          products ( name, sku ),
          warehouses ( name )
        `)
        .order('available_qty', { ascending: true }); // worst first

      if (err) { setError(err.message); }
      else if (data) { setItems(data.map(computeItem)); }
      setLoading(false);
    };

    loadInitial();

    channelRef.current = supabase
      .channel('ops_inventory_live')
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'product_inventory' }, p => upsertItem(p.new))
      .on('postgres_changes', { event: 'UPDATE', schema: 'public', table: 'product_inventory' }, p => upsertItem(p.new))
      .on('postgres_changes', { event: 'INSERT', schema: 'public', table: 'inventory_reservations' }, () => loadInitial())
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, []);

  return { items, loading, error };
}
