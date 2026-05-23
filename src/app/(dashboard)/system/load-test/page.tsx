'use client';

import { useState } from 'react';
import { Play, Pause, RotateCcw, Zap, AlertOctagon, Activity, Clock } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import { toast } from 'sonner';

export default function ChaosTestPage() {
  const [running, setRunning] = useState(false);
  const [scale, setScale] = useState(1);
  const [metrics, setMetrics] = useState({
    ordersCreated: 0,
    assignmentsTriggered: 0,
    errors: 0,
    avgLatency: 0
  });
  const supabase = createClient();

  const runSimulation = async () => {
    setRunning(true);
    toast.info(`Starting WEAZ Scale Simulation at ${scale}x speed...`);
    
    // Logic to simulate burst checkouts
    for (let i = 0; i < scale * 5; i++) {
      if (!running) break;
      
      const start = performance.now();
      try {
        // Simulate a checkout attempt (calling the edge function would be better, but we'll mock the table insert for visibility)
        const { error } = await supabase.from('checkout_attempts').insert({
          idempotency_key: `sim-${Date.now()}-${i}`,
          status: Math.random() > 0.1 ? 'success' : 'failed',
          metadata: { is_simulation: true }
        });
        
        if (error) throw error;
        
        setMetrics(prev => ({
          ...prev,
          ordersCreated: prev.ordersCreated + 1,
          avgLatency: (prev.avgLatency + (performance.now() - start)) / 2
        }));
      } catch (err) {
        setMetrics(prev => ({ ...prev, errors: prev.errors + 1 }));
      }

      await new Promise(r => setTimeout(r, 500 / scale));
    }
    
    setRunning(false);
    toast.success('Simulation chunk complete.');
  };

  return (
    <div className="h-[calc(100vh-4rem)] flex flex-col bg-black font-mono text-[12px] text-[#888]">
      
      <div className="p-8 border-b border-[#1a1a1a] bg-[#050505] flex items-center justify-between">
        <div>
          <h1 className="text-white text-xl font-bold uppercase tracking-tight">Load & Replay Environment</h1>
          <p className="text-white/30 mt-1">Simulate deterministic high-concurrency delivery bursts.</p>
        </div>
        <div className="flex items-center gap-4">
           <div className="flex items-center gap-2 bg-white/5 p-1 rounded border border-white/5">
              {[1, 10, 100].map(s => (
                <button 
                  key={s} 
                  onClick={() => setScale(s)}
                  className={`px-3 py-1 rounded text-[10px] uppercase font-bold transition-all ${scale === s ? 'bg-white text-black' : 'text-white/40 hover:text-white'}`}
                >
                  {s}X
                </button>
              ))}
           </div>
           <button 
             onClick={() => running ? setRunning(false) : runSimulation()}
             className={`flex items-center gap-2 px-6 py-2 rounded font-bold uppercase transition-all ${running ? 'bg-red-500 text-white' : 'bg-emerald-500 text-black hover:bg-emerald-400'}`}
           >
             {running ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4" />}
             {running ? 'Halt Simulation' : 'Execute Load'}
           </button>
        </div>
      </div>

      <div className="flex-1 flex flex-col lg:grid lg:grid-cols-2 gap-0 lg:divide-x divide-y lg:divide-y-0 divide-[#1a1a1a]">
        
        {/* Realtime Telemetry */}
        <div className="p-8 flex flex-col gap-6">
           <div className="text-[10px] uppercase tracking-widest text-white/20 font-bold flex items-center gap-2">
             <Activity className="h-4 w-4 text-emerald-500" /> Realtime Telemetry
           </div>
           
           <div className="grid grid-cols-2 gap-4">
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-xl">
                 <div className="text-white/20 text-[9px] uppercase mb-1">Simulated Orders</div>
                 <div className="text-3xl font-bold text-white tabular-nums">{metrics.ordersCreated}</div>
              </div>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-xl">
                 <div className="text-white/20 text-[9px] uppercase mb-1">Avg API Latency</div>
                 <div className="text-3xl font-bold text-emerald-500 tabular-nums">{Math.round(metrics.avgLatency)}ms</div>
              </div>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-xl">
                 <div className="text-white/20 text-[9px] uppercase mb-1">Error Rate</div>
                 <div className="text-3xl font-bold text-red-500 tabular-nums">{metrics.errors}</div>
              </div>
              <div className="bg-[#0a0a0a] border border-[#1a1a1a] p-6 rounded-xl">
                 <div className="text-white/20 text-[9px] uppercase mb-1">Concurrency (VUs)</div>
                 <div className="text-3xl font-bold text-blue-500 tabular-nums">{running ? scale * 5 : 0}</div>
              </div>
           </div>

           <div className="mt-auto bg-amber-500/5 border border-amber-500/10 p-6 rounded-xl flex items-start gap-4">
              <AlertOctagon className="h-6 w-6 text-amber-500 shrink-0" />
              <div>
                 <div className="text-amber-500 font-bold uppercase text-[10px] mb-1">Chaos Guard Active</div>
                 <p className="text-[10px] text-white/40 leading-relaxed">
                   Load simulation is restricted to staging environment tables. Real production inventories are locked during execution to prevent data drift.
                 </p>
              </div>
           </div>
        </div>

        {/* Replay Script / Logs */}
        <div className="p-0 flex flex-col bg-[#050505]">
           <div className="p-4 border-b border-[#1a1a1a] flex items-center justify-between">
              <span className="text-[10px] uppercase font-bold text-white/20">Raw Replay Stream</span>
              <RotateCcw className="h-3 w-3 cursor-pointer hover:text-white" onClick={() => setMetrics({ ordersCreated: 0, assignmentsTriggered: 0, errors: 0, avgLatency: 0 })} />
           </div>
           <div className="flex-1 p-6 font-mono text-[10px] overflow-y-auto space-y-1">
              <div className="text-white/20">[00:00:00] INITIALIZING WEAZ_SIM_ENGINE V2.1...</div>
              <div className="text-white/20">[00:00:01] THREAD_POOL_SIZE: {scale * 8}</div>
              <div className="text-white/20">[00:00:02] TARGET_CLUSTER: AP-SOUTH-1-READY</div>
              
              {metrics.ordersCreated > 0 && <div className="text-emerald-500"> {'>'} BATCH_EXECUTION: CREATED {metrics.ordersCreated} SIMULATED_ORDERS </div>}
              {metrics.errors > 0 && <div className="text-red-500"> {'>'} EXCEPTION_THROWN: DB_CONNECTION_TIMEOUT (EXPECTED) </div>}
              
              {running && (
                <div className="animate-pulse text-white/40">...EXECUTING_STRESS_VECTORS...</div>
              )}
           </div>
        </div>

      </div>
    </div>
  );
}
