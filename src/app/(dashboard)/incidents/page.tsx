'use client';

import { useState, useMemo } from 'react';
import { useIncidents, type Incident } from '@/hooks/useIncidents';
import { AlertTriangle, ShieldAlert, Clock, CheckCircle2, XCircle, ChevronRight, RefreshCw, Filter } from 'lucide-react';
import { formatDistanceToNow, format } from 'date-fns';
import { toast } from 'sonner';
import Link from 'next/link';

const SEVERITY_STYLES: Record<Incident['severity'], string> = {
  critical: 'text-red-400 bg-red-500/10 border-red-500/20',
  high: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  medium: 'text-amber-400 bg-amber-500/10 border-amber-500/20',
  low: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
};

const STATUS_STYLES: Record<Incident['status'], string> = {
  open: 'text-red-400',
  investigating: 'text-amber-400',
  resolved: 'text-green-400',
  ignored: 'text-white/20'
};

const CATEGORY_LABELS: Record<string, string> = {
  payment_failure: 'Payment Failure',
  inventory_mismatch: 'Inventory Mismatch',
  assignment_failure: 'Assignment Failure',
  stuck_order: 'Stuck Order',
  high_latency: 'High Latency',
  oversell: 'Oversell Risk'
};

export default function IncidentsPage() {
  const { incidents, loading, error, updateIncidentStatus } = useIncidents();
  const [selected, setSelected] = useState<Incident | null>(null);
  const [filter, setFilter] = useState<Incident['severity'] | 'all'>('all');

  const filtered = useMemo(() => 
    filter === 'all' ? incidents : incidents.filter(i => i.severity === filter)
  , [incidents, filter]);

  const stats = useMemo(() => ({
    open: incidents.filter(i => i.status !== 'resolved').length,
    critical: incidents.filter(i => i.severity === 'critical' && i.status !== 'resolved').length,
    high: incidents.filter(i => i.severity === 'high' && i.status !== 'resolved').length,
    resolved: incidents.filter(i => i.status === 'resolved' && new Date(i.resolved_at!).toDateString() === new Date().toDateString()).length,
  }), [incidents]);

  const handleStatusUpdate = async (id: string, status: Incident['status']) => {
    try {
      await updateIncidentStatus(id, status);
      toast.success(`Incident moved to ${status}`);
    } catch (err: any) {
      toast.error(`Update failed: ${err.message}`);
    }
  };

  if (error) return <div className="p-10 text-red-500 bg-black h-full font-mono">Error: {error}</div>;

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-black font-mono text-[12px] text-[#888]">

      {/* Top Bar */}
      <div className="grid grid-cols-4 divide-x divide-[#1a1a1a] border-b border-[#1a1a1a]">
        {[
          { label: 'Unresolved', value: stats.open, color: 'text-red-400' },
          { label: 'Critical', value: stats.critical, color: 'text-red-500 font-bold' },
          { label: 'High Priority', value: stats.high, color: 'text-orange-400' },
          { label: 'Resolved Today', value: stats.resolved, color: 'text-green-400' },
        ].map(stat => (
          <div key={stat.label} className="p-3">
            <div className="text-[10px] uppercase text-white/30">{stat.label}</div>
            <div className={`mt-1 text-xl font-medium ${stat.color}`}>{loading ? '...' : stat.value}</div>
          </div>
        ))}
      </div>

      {/* Filter Bar */}
      <div className="flex items-center gap-2 border-b border-[#1a1a1a] bg-[#050505] px-4 py-2">
        <Filter className="h-3 w-3 text-white/20 mr-1" />
        <span className="text-[10px] uppercase text-white/30 mr-2">Filter:</span>
        {(['all', 'critical', 'high', 'medium', 'low'] as const).map(f => (
          <button
            key={f}
            onClick={() => setFilter(f)}
            className={`rounded px-2.5 py-1 text-[10px] uppercase transition-colors ${filter === f ? 'bg-white/10 text-white' : 'text-white/30 hover:text-white/60'}`}
          >
            {f}
          </button>
        ))}
        {loading && <RefreshCw className="h-3.5 w-3.5 animate-spin ml-auto text-white/10" />}
      </div>

      <div className="flex flex-1 overflow-hidden">

        {/* Incident List */}
        <div className="flex flex-1 flex-col overflow-y-auto bg-[#020202]">
          <div className="grid grid-cols-[100px_1fr_120px_100px_100px_90px] gap-4 border-b border-[#1a1a1a] bg-[#030303] px-5 py-2 text-[10px] uppercase text-white/30 tracking-tight">
            <span>ID</span>
            <span>Title / Metadata</span>
            <span>Category</span>
            <span>Severity</span>
            <span>Status</span>
            <span className="text-right">Age</span>
          </div>

          {filtered.length === 0 ? (
             <div className="p-20 text-center text-white/10 uppercase tracking-[0.2em]">Silence is golden. No incidents detected.</div>
          ) : filtered.map(inc => (
            <div
              key={inc.id}
              onClick={() => setSelected(inc)}
              className={`grid cursor-pointer grid-cols-[100px_1fr_120px_100px_100px_90px] items-center gap-4 border-b border-[#1a1a1a]/40 px-5 py-3 transition-colors hover:bg-[#0d0d0d] ${selected?.id === inc.id ? 'bg-[#0d0d0d] border-l-2 border-l-white' : 'border-l-2 border-l-transparent'}`}
            >
              <span className="text-white/30 font-mono text-[10px]">{inc.id.substring(0,8)}...</span>
              <div className="flex flex-col min-w-0">
                <span className="truncate text-[11px] text-white font-medium">{inc.title}</span>
                {inc.affected_entity_id && (
                  <span className="text-[9px] text-white/20 mt-0.5">ENTITY: {inc.affected_entity_id}</span>
                )}
              </div>
              <span className="text-[10px] text-white/40">{CATEGORY_LABELS[inc.category] || inc.category}</span>
              <div>
                <span className={`inline-flex rounded border px-1.5 py-0.5 text-[9px] font-bold uppercase transition-all ${SEVERITY_STYLES[inc.severity]}`}>
                  {inc.severity}
                </span>
              </div>
              <span className={`text-[10px] uppercase font-semibold tabular-nums ${STATUS_STYLES[inc.status]}`}>{inc.status}</span>
              <span className="text-right text-white/30 text-[10px] tabular-nums">
                {formatDistanceToNow(new Date(inc.opened_at), { addSuffix: false })}
              </span>
            </div>
          ))}
        </div>

        {/* Detail Panel */}
        {selected ? (
          <div className="flex w-80 flex-col border-l border-[#1a1a1a] bg-[#050505]">
            <div className="flex items-start justify-between border-b border-[#1a1a1a] bg-[#0a0a0a] p-4">
              <div className="min-w-0">
                <h2 className="text-[12px] font-bold text-white font-mono">{selected.id.substring(0,8)}...</h2>
                <p className="mt-1 text-[10px] text-white/30 truncate">{CATEGORY_LABELS[selected.category]}</p>
              </div>
              <span className={`shrink-0 rounded border px-2 py-0.5 text-[9px] font-bold uppercase ${SEVERITY_STYLES[selected.severity]}`}>
                {selected.severity}
              </span>
            </div>

            <div className="flex flex-col gap-4 p-4 overflow-y-auto">
              <p className="text-[11px] text-[#c0c0c0] leading-relaxed bg-black/40 p-3 rounded border border-[#1a1a1a]">{selected.title}</p>

              <div className="grid grid-cols-2 gap-2">
                <div className="rounded border border-[#1a1a1a] bg-black/50 p-3">
                  <div className="text-[9px] uppercase text-white/20 mb-1">Status</div>
                  <div className={`text-[11px] font-bold uppercase ${STATUS_STYLES[selected.status]}`}>{selected.status}</div>
                </div>
                <div className="rounded border border-[#1a1a1a] bg-black/50 p-3">
                  <div className="text-[9px] uppercase text-white/20 mb-1">Category</div>
                  <div className="text-[10px] font-medium text-white/60 truncate">{selected.category}</div>
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded border border-[#1a1a1a] bg-black/50 p-3 space-y-3">
                <div className="text-[9px] uppercase text-white/20 mb-2 font-bold tracking-wider">Log Timeline</div>
                <div className="flex items-center gap-3">
                  <div className="h-1.5 w-1.5 rounded-full bg-red-400" />
                  <div>
                    <div className="text-[10px] text-white/80">Detection Event</div>
                    <div className="text-[9px] text-white/20">{format(new Date(selected.opened_at), 'PPP HH:mm:ss')}</div>
                  </div>
                </div>
                {selected.status === 'investigating' && (
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-amber-400" />
                    <div>
                      <div className="text-[10px] text-white/80">Ops Review Started</div>
                      <div className="text-[9px] text-white/20">Awaiting triage...</div>
                    </div>
                  </div>
                )}
                {selected.resolved_at && (
                  <div className="flex items-center gap-3">
                    <div className="h-1.5 w-1.5 rounded-full bg-green-400" />
                    <div>
                      <div className="text-[10px] text-white/80">Resolution Verified</div>
                      <div className="text-[9px] text-white/20">{format(new Date(selected.resolved_at), 'HH:mm:ss')}</div>
                    </div>
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex flex-col gap-2 mt-2">
                <Link 
                  href={`/incidents/${selected.id}`}
                  className="flex w-full items-center justify-center gap-2 rounded bg-white/10 py-2 text-[10px] font-bold text-white hover:bg-white/20 transition-all border border-white/10"
                >
                   OPEN FULL INVESTIGATION RECORD
                </Link>

                {selected.status === 'open' && (
                  <button 
                    onClick={() => handleStatusUpdate(selected.id, 'investigating')}
                    className="flex w-full items-center justify-center gap-2 rounded bg-amber-500/10 py-2 border border-amber-500/20 text-[10px] font-bold text-amber-500 hover:bg-amber-500/20 transition-all"
                  >
                    START INVESTIGATION
                  </button>
                )}
                
                {selected.status !== 'resolved' && (
                  <button 
                    onClick={() => handleStatusUpdate(selected.id, 'resolved')}
                    className="flex w-full items-center justify-center gap-2 rounded bg-green-500/10 py-2 border border-green-500/20 text-[10px] font-bold text-green-500 hover:bg-green-500/20 transition-all"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" /> MARK AS RESOLVED
                  </button>
                )}

                <button className="flex w-full items-center justify-center gap-2 rounded bg-white/5 py-2 text-[10px] font-bold text-white/40 hover:bg-white/10 transition-all">
                  ESCALATE VIA SLACK
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="flex w-80 flex-col items-center justify-center text-white/10 uppercase tracking-widest border-l border-[#1a1a1a]">
             <ShieldAlert className="h-10 w-10 mb-4 stroke-[0.5]" />
             <span className="text-[10px]">Select Incident</span>
          </div>
        )}
      </div>
    </div>
  );
}
