'use client';

import { useParams, useRouter } from 'next/navigation';
import { useIncidents, type Incident } from '@/hooks/useIncidents';
import { 
  ShieldAlert, ShieldCheck, Clock, User, 
  Tag, MessageSquare, ChevronLeft, CheckCircle2,
  AlertCircle, Activity, ExternalLink
} from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { useState, useEffect } from 'react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function IncidentDetailPage() {
  const params = useParams();
  const id = params.id as string;
  const router = useRouter();
  const { updateIncidentStatus } = useIncidents();
  const [incident, setIncident] = useState<any>(null);
  const [events, setEvents] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const supabase = createClient();

  useEffect(() => {
    async function loadDetail() {
      setLoading(true);
      const [incRes, eventsRes] = await Promise.all([
        supabase.from('incidents').select('*, owner:auth.users(email)').eq('id', id).single(),
        supabase.from('incident_events').select('*, actor:auth.users(email)').eq('incident_id', id).order('created_at', { ascending: false })
      ]);

      if (incRes.data) setIncident(incRes.data);
      if (eventsRes.data) setEvents(eventsRes.data);
      setLoading(false);
    }
    loadDetail();
  }, [id]);

  const handleAction = async (status: string) => {
    try {
      await updateIncidentStatus(id, status as any);
      toast.success(`Moved to ${status}`);
      // Refresh local state (simplistic)
      window.location.reload();
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  if (loading) return <div className="p-20 bg-black text-white font-mono animate-pulse uppercase tracking-widest text-center">Decrypting Incident Logs...</div>;
  if (!incident) return <div className="p-20 bg-black text-red-500 font-mono">Incident Record Missing.</div>;

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-black text-[#888] font-mono text-[12px] flex flex-col">
      
      {/* Detail Header */}
      <div className="border-b border-[#1a1a1a] bg-[#050505] p-6 flex items-center justify-between">
        <div className="flex items-center gap-6">
          <button onClick={() => router.back()} className="p-2 hover:bg-white/5 rounded border border-white/5 transition-colors">
            <ChevronLeft className="h-4 w-4" />
          </button>
          <div>
            <div className="flex items-center gap-3 mb-1">
              <span className="text-white/20 uppercase tracking-tighter text-[10px]">Case ID: {incident.id}</span>
              <span className={`px-1.5 py-0.5 rounded text-[10px] font-bold uppercase border ${
                incident.severity === 'critical' ? 'bg-red-500/10 text-red-500 border-red-500/20' : 
                incident.severity === 'high' ? 'bg-orange-500/10 text-orange-500 border-orange-500/20' : 
                'bg-blue-500/10 text-blue-500 border-blue-500/20'
              }`}>
                {incident.severity}
              </span>
            </div>
            <h1 className="text-xl font-bold text-white tracking-tight">{incident.title}</h1>
          </div>
        </div>
        <div className="flex gap-2">
           {incident.status === 'open' && (
             <button 
               onClick={() => handleAction('acknowledged')}
               className="bg-white text-black px-4 py-2 font-bold uppercase hover:bg-white/90 transition-all rounded"
              >
                Acknowledge
             </button>
           )}
           {['open', 'acknowledged'].includes(incident.status) && (
             <button 
               onClick={() => handleAction('investigating')}
               className="border border-white/10 text-white px-4 py-2 font-bold uppercase hover:bg-white/5 transition-all rounded"
              >
                Start Investigation
             </button>
           )}
           {incident.status !== 'resolved' && incident.status !== 'closed' && (
             <button 
               onClick={() => handleAction('resolved')}
               className="bg-emerald-600 text-white px-4 py-2 font-bold uppercase hover:bg-emerald-700 transition-all rounded"
              >
                Resolve
             </button>
           )}
        </div>
      </div>

      <div className="flex-1 grid grid-cols-[1fr_350px]">
        {/* Main Feed */}
        <div className="p-8 space-y-8 overflow-y-auto">
          
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6">
             <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-white/30 tracking-widest text-[10px] font-bold uppercase">
                  <Activity className="h-3 w-3" /> Context Metrics
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Category</span>
                    <span className="text-white capitalize">{incident.category}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Entity Type</span>
                    <span className="text-white capitalize">{incident.affected_entity_type || 'System'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Impact Level</span>
                    <span className={`capitalize font-bold ${
                      incident.impact_level === 'critical' ? 'text-red-500' : 'text-amber-500'
                    }`}>{incident.impact_level}</span>
                  </div>
                </div>
             </div>

             <div className="bg-[#0a0a0a] border border-[#1a1a1a] rounded-xl p-5 space-y-4">
                <div className="flex items-center gap-2 text-white/30 tracking-widest text-[10px] font-bold uppercase">
                  <User className="h-3 w-3" /> Assignments
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span>Current Owner</span>
                    <span className="text-white">{incident.owner?.email || 'Unassigned'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Status</span>
                    <span className="text-emerald-500 uppercase font-bold">{incident.status}</span>
                  </div>
                  <button className="w-full mt-2 text-[10px] border border-white/5 py-1.5 rounded hover:bg-white/5 transition-all">
                    CLAIM INCIDENT
                  </button>
                </div>
             </div>
          </div>

          <div className="space-y-4">
             <div className="flex items-center gap-2 text-white/30 tracking-widest text-[10px] font-bold uppercase">
               <MessageSquare className="h-3 w-3" /> Internal Timeline
             </div>
             <div className="space-y-4 before:absolute before:left-3 before:top-2 before:bottom-0 before:w-px before:bg-white/5 relative pl-8">
               {events.map((event, i) => (
                 <div key={event.id} className="relative">
                    <div className={`absolute -left-[32px] top-1 h-3 w-3 rounded-full border-2 border-black ${
                      event.event_type === 'opened' ? 'bg-red-500' : 
                      event.event_type === 'resolved' ? 'bg-emerald-500' : 
                      'bg-amber-500'
                    }`} />
                    <div className="bg-[#070707] border border-[#1a1a1a] p-4 rounded-lg">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-white font-bold uppercase text-[10px]">{event.event_type}</span>
                        <span className="text-white/20 text-[10px]">{formatDistanceToNow(new Date(event.created_at))} ago</span>
                      </div>
                      <p className="text-white/60 leading-relaxed mb-2">{event.note}</p>
                      <div className="text-[9px] text-white/10 italic">Actor: {event.actor?.email || 'System'}</div>
                    </div>
                 </div>
               ))}
             </div>
          </div>
        </div>

        {/* Sidebar: Details & Actions */}
        <div className="border-l border-[#1a1a1a] bg-[#030303] flex flex-col gap-6 p-6">
          
          <div className="space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Affected Record</span>
            {incident.affected_entity_id ? (
              <div className="bg-white/5 border border-white/10 rounded p-4 flex items-center justify-between">
                <div className="flex flex-col gap-1">
                  <span className="text-white font-bold">{incident.affected_entity_type?.toUpperCase()}</span>
                  <span className="text-[10px] text-white/40">{incident.affected_entity_id}</span>
                </div>
                <ExternalLink className="h-3.5 w-3.5 cursor-pointer hover:text-white" />
              </div>
            ) : (
              <div className="p-4 text-center border border-dashed border-white/5 text-white/10">Global Impact</div>
            )}
          </div>

          <div className="space-y-4">
            <span className="text-[10px] font-bold uppercase tracking-widest text-white/20">Metadata Payload</span>
            <pre className="bg-[#050505] p-3 rounded border border-white/5 text-[9px] text-emerald-500/80 overflow-x-auto whitespace-pre-wrap leading-tight">
              {JSON.stringify(incident.metadata, null, 2)}
            </pre>
          </div>

          <div className="mt-auto space-y-4">
            <div className="bg-red-500/5 border border-red-500/10 p-4 rounded-lg">
              <div className="flex items-center gap-2 text-red-500 mb-2">
                <AlertCircle className="h-4 w-4" />
                <span className="text-[11px] font-bold">RE-ESCALATE</span>
              </div>
              <p className="text-[10px] text-white/40 leading-relaxed mb-3">Notify on-call engineering directly via PagerDuty/Slack.</p>
              <button className="w-full bg-red-600/20 text-red-500 border border-red-500/20 py-2 rounded font-bold hover:bg-red-500/30 transition-all">PAGING ON-CALL</button>
            </div>
           </div>
        </div>
      </div>
    </div>
  );
}
