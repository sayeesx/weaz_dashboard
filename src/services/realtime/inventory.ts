import { supabase } from '@/lib/supabase/client';

export function subscribeToInventory(callback: (payload: unknown) => void) {
  const channel = supabase
    .channel('realtime:inventory')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'product_inventory' },
      callback
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'inventory_movements' },
      callback
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
