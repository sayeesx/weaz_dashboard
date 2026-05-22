import { supabase } from '@/lib/supabase/client';
import type { Order } from '@/types';

export function subscribeToOrders(callback: (payload: { eventType: string; new: Order; old: Order }) => void) {
  const channel = supabase
    .channel('realtime:orders')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'orders' },
      (payload) => callback(payload as unknown as { eventType: string; new: Order; old: Order })
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}

export function subscribeToOrderStatus(orderId: string, callback: (status: string) => void) {
  const channel = supabase
    .channel(`order:${orderId}`)
    .on(
      'postgres_changes',
      { event: 'UPDATE', schema: 'public', table: 'orders', filter: `id=eq.${orderId}` },
      (payload) => callback((payload.new as Order).status)
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
