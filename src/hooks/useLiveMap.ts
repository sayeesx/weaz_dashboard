import { createClient } from '@/lib/supabase/client';
import { useEffect, useRef, useState, useCallback } from 'react';

export interface LiveLocation {
  lat: number;
  lng: number;
}

export interface MapPartner {
  id: string;
  name: string;
  location: LiveLocation;
  status: 'available' | 'busy' | 'offline';
  load: number;
}

export interface MapOrder {
  id: string;
  location: LiveLocation;
  status: string;
}

export function useLiveMap() {
  const supabase = createClient();
  const [partners, setPartners] = useState<MapPartner[]>([]);
  const [orders, setOrders] = useState<MapOrder[]>([]);
  const [loading, setLoading] = useState(true);
  
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchState = useCallback(async () => {
    const [partnersRes, ordersRes] = await Promise.all([
      supabase
        .from('partner_status')
        .select('partner_id, is_online, current_load, current_location, profiles(full_name)')
        .eq('is_online', true),
      supabase
        .from('orders')
        .select(`
          id, status, 
          addresses!inner(latitude, longitude)
        `)
        .in('status', ['assigning', 'assigned', 'picked_up', 'on_the_way'])
    ]);

    if (partnersRes.data) {
      setPartners(partnersRes.data.map((p: any) => ({
        id: p.partner_id,
        name: p.profiles?.full_name ?? 'Partner',
        // In Supabase, point is returned as { x, y } (lng, lat)
        location: { 
          lat: p.current_location?.y ?? 12.9716, 
          lng: p.current_location?.x ?? 77.5946 
        },
        status: p.current_load > 0 ? 'busy' : 'available',
        load: p.current_load
      })));
    }

    if (ordersRes.data) {
      setOrders(ordersRes.data.map((o: any) => ({
        id: o.id,
        status: o.status,
        location: {
          lat: o.addresses.latitude,
          lng: o.addresses.longitude
        }
      })));
    }
    
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchState();

    channelRef.current = supabase
      .channel('ops_live_map')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'partner_status' }, () => fetchState())
      .on('postgres_changes', { event: '*', schema: 'public', table: 'orders' }, () => fetchState())
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [fetchState]);

  return { partners, orders, loading };
}
