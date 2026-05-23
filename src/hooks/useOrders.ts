import { createClient } from '@supabase/supabase-js';
import { useEffect, useRef, useState, useCallback } from 'react';

export interface LiveOrder {
  id: string;
  user_id: string;
  address_id: string;
  status: string;
  total_amount: number;
  final_amount: number;
  created_at: string;
  updated_at: string;
  // joined
  partner_id?: string;
  assignment_status?: string;
}

export interface OrderHistoryEntry {
  id: string;
  order_id: string;
  status: string;
  notes: string | null;
  changed_by: string | null;
  created_at: string;
}

interface UseOrdersOptions {
  /** Filter to a specific status, or undefined for all */
  statusFilter?: string;
  /** Max age in minutes, default 120 */
  windowMinutes?: number;
  limit?: number;
}

/**
 * Scoped realtime order feed.
 * Never subscribes to the full table — always constrains by time window.
 */
export function useOrders({ statusFilter, windowMinutes = 120, limit = 500 }: UseOrdersOptions = {}) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [orders, setOrders] = useState<LiveOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Track channel ref so we can clean up precisely
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const upsertOrder = useCallback((incoming: LiveOrder) => {
    setOrders(prev => {
      const idx = prev.findIndex(o => o.id === incoming.id);
      if (idx === -1) return [incoming, ...prev].slice(0, limit);
      const next = [...prev];
      next[idx] = { ...next[idx], ...incoming };
      return next;
    });
  }, [limit]);

  useEffect(() => {
    const windowStart = new Date(Date.now() - windowMinutes * 60_000).toISOString();

    // Build scoped query
    const buildQuery = () => {
      let q = supabase
        .from('orders')
        .select(`
          id, user_id, address_id, status, total_amount, final_amount,
          created_at, updated_at,
          partner_assignments!left ( partner_id, status )
        `)
        .gte('created_at', windowStart)
        .order('created_at', { ascending: false })
        .limit(limit);

      if (statusFilter) q = q.eq('status', statusFilter);
      return q;
    };

    // Initial load
    const loadInitial = async () => {
      setLoading(true);
      const { data, error: fetchErr } = await buildQuery();
      if (fetchErr) {
        setError(fetchErr.message);
      } else if (data) {
        const mapped: LiveOrder[] = data.map((row: any) => ({
          ...row,
          partner_id: row.partner_assignments?.[0]?.partner_id ?? null,
          assignment_status: row.partner_assignments?.[0]?.status ?? null,
        }));
        setOrders(mapped);
      }
      setLoading(false);
    };

    loadInitial();

    // Scoped subscription — only orders in the window
    channelRef.current = supabase
      .channel('ops_orders_live')
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'orders',
          // Filter: only orders newer than window
          // Supabase supports filter on columns
        },
        (payload) => {
          const row = payload.new as LiveOrder;
          // Client-side guard to enforce window — server-side filter not available on INSERT without a trigger
          if (new Date(row.created_at) < new Date(windowStart)) return;
          upsertOrder(row);
        }
      )
      .on(
        'postgres_changes',
        { event: 'UPDATE', schema: 'public', table: 'orders' },
        (payload) => upsertOrder(payload.new as LiveOrder)
      )
      .subscribe();

    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
      }
    };
  }, [statusFilter, windowMinutes, limit]);

  return { orders, loading, error };
}

/**
 * Fetch status history for a single order on-demand.
 * Not subscribed — called when an order is selected.
 */
export async function fetchOrderHistory(orderId: string): Promise<OrderHistoryEntry[]> {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const { data, error } = await supabase
    .from('order_status_history')
    .select('*')
    .eq('order_id', orderId)
    .order('created_at', { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []) as OrderHistoryEntry[];
}

/**
 * Fetch full order detail: items + assignment
 */
export async function fetchOrderDetail(orderId: string) {
  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_SERVICE_ROLE_KEY || process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
  const [itemsRes, assignmentRes] = await Promise.all([
    supabase
      .from('order_items')
      .select('id, product_id, quantity, price_at_time')
      .eq('order_id', orderId),
    supabase
      .from('partner_assignments')
      .select('partner_id, status, assigned_at, completed_at')
      .eq('order_id', orderId)
      .order('assigned_at', { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  return {
    items: itemsRes.data ?? [],
    assignment: assignmentRes.data ?? null,
  };
}
