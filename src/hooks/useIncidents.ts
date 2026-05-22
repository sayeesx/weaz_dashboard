import { createClient } from '@/lib/supabase/client';
import { useEffect, useRef, useState, useCallback } from 'react';

export interface Incident {
  id: string;
  title: string;
  category: string;
  severity: 'critical' | 'high' | 'medium' | 'low';
  status: 'open' | 'investigating' | 'resolved' | 'ignored';
  affected_entity_id: string | null;
  affected_entity_type: string | null;
  metadata: any;
  opened_at: string;
  resolved_at: string | null;
  created_at: string;
}

export function useIncidents() {
  const supabase = createClient();
  const [incidents, setIncidents] = useState<Incident[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const channelRef = useRef<ReturnType<typeof supabase.channel> | null>(null);

  const fetchIncidents = useCallback(async () => {
    setLoading(true);
    const { data, error: err } = await supabase
      .from('incidents')
      .select('*')
      .order('opened_at', { ascending: false })
      .limit(100);

    if (err) setError(err.message);
    else if (data) setIncidents(data);
    setLoading(false);
  }, []);

  const updateIncidentStatus = async (id: string, status: Incident['status'], note?: string) => {
    const { data: userRes } = await supabase.auth.getUser();
    if (!userRes.user) throw new Error('Not authenticated');

    const update: any = { status, updated_at: new Date().toISOString() };
    if (status === 'resolved') {
      update.resolved_at = new Date().toISOString();
      update.resolved_by = userRes.user.id;
    }

    const { error: err } = await supabase
      .from('incidents')
      .update(update)
      .eq('id', id);

    if (err) throw err;

    // Log event
    await supabase.from('incident_events').insert({
      incident_id: id,
      event_type: status,
      actor_id: userRes.user.id,
      note: note || `Status changed to ${status}`
    });

    fetchIncidents();
  };

  useEffect(() => {
    fetchIncidents();

    channelRef.current = supabase
      .channel('ops_incidents_live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'incidents' }, () => {
        fetchIncidents();
      })
      .subscribe();

    return () => {
      if (channelRef.current) supabase.removeChannel(channelRef.current);
    };
  }, [fetchIncidents]);

  return { incidents, loading, error, updateIncidentStatus, refresh: fetchIncidents };
}
