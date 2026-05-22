import { supabase } from '@/lib/supabase/client';

export function subscribeToDelivery(callback: (payload: unknown) => void) {
  const channel = supabase
    .channel('realtime:delivery')
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'partner_location' },
      callback
    )
    .on(
      'postgres_changes',
      { event: '*', schema: 'public', table: 'partner_assignments' },
      callback
    )
    .subscribe();

  return () => { supabase.removeChannel(channel); };
}
