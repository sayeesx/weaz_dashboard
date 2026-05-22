import { createClient } from '@/lib/supabase/client';
import { useEffect, useRef, useState, useCallback } from 'react';

export interface DispatchOrder {
  id: string;
  status: string;
  total_amount: number;
  created_at: string;
  updated_at: string;
  user_id: string;
}

export interface DispatchPartner {
  id: string;
  name: string;
  is_online: boolean;
  current_load: number;
  capacity: number;
  last_ping: string;
}

export function useDispatch() {
  const supabase = createClient();
  const [unassignedOrders, setUnassignedOrders] = useState<DispatchOrder[]>([]);
  const [partners, setPartners] = useState<DispatchPartner[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchState = useCallback(async () => {
    setLoading(true);
    
    const [ordersRes, partnersRes] = await Promise.all([
      supabase
        .from('orders')
        .select('id, status, total_amount, created_at, updated_at, user_id')
        .in('status', ['paid', 'assigning'])
        .order('created_at', { ascending: true }),
      supabase
        .from('partner_status')
        .select(`
          partner_id, is_online, current_load, capacity, last_ping,
          profiles!inner(full_name)
        `)
        .eq('is_online', true)
    ]);

    if (ordersRes.error) setError(ordersRes.error.message);
    if (partnersRes.error) setError(partnersRes.error.message);

    if (ordersRes.data) setUnassignedOrders(ordersRes.data);
    if (partnersRes.data) {
      const mappedPartners = partnersRes.data.map((p: any) => ({
        id: p.partner_id,
        name: p.profiles?.full_name ?? 'Partner',
        is_online: p.is_online,
        current_load: p.current_load,
        capacity: p.capacity,
        last_ping: p.last_ping
      }));
      setPartners(mappedPartners);
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchState();

    channelRef.current = supabase
      .channel('ops_dispatch_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, (payload: any) => {
        const order = payload.new as DispatchOrder;
        const oldOrder = payload.old as DispatchOrder;
        
        // If order enters unassigned pool
        if (['paid', 'assigning'].includes(order.status)) {
          setUnassignedOrders(prev => {
            const exists = prev.find(o => o.id === order.id);
            if (exists) return prev.map(o => o.id === order.id ? order : o);
            return [...prev, order].sort((a,b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
          });
        } 
        // If order leaves unassigned pool
        else if (oldOrder && ['paid', 'assigning'].includes(oldOrder.status)) {
          setUnassignedOrders(prev => prev.filter(o => o.id !== order.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_status' }, () => {
        // Simple strategy: refetch partners on any status change (online/offline/load)
        // In a high-traffic system, we'd granularly update state here
        fetchState();
      })
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [fetchState]);

  return { unassignedOrders, partners, loading, error, refresh: fetchState };
}

export async function manualAssign(orderId: string, partnerId: string) {
  const supabase = createClient();
  // Using an RPC or Edge function is preferred
  const { data: userRes } = await supabase.auth.getUser();
  if (!userRes.user) throw new Error('Not authenticated');

  const { error } = await supabase.rpc('order_transition', {
    p_order_id: orderId,
    p_new_status: 'assigning',
    p_user_id: userRes.user.id,
    p_notes: `Manual assignment triggered to partner ${partnerId}`
  });

  if (error) throw error;

  // Then create assignment
  const { error: assignError } = await supabase
    .from('partner_assignments')
    .insert({
      order_id: orderId,
      partner_id: partnerId,
      status: 'assigned'
    });

  if (assignError) throw assignError;

  return true;
}
