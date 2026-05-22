'use client';

import { motion } from 'framer-motion';
import { Database, Server, Wifi, Clock, HardDrive, Zap } from 'lucide-react';
import { cn } from '@/lib/utils';

const HEALTH_ITEMS = [
  { label: 'Supabase DB', status: 'healthy', latency: '12ms', icon: Database, uptime: '99.99%' },
  { label: 'Redis Cache', status: 'healthy', latency: '3ms', icon: Server, uptime: '99.95%' },
  { label: 'Realtime WS', status: 'healthy', latency: '8ms', icon: Wifi, uptime: '99.98%' },
  { label: 'Edge Functions', status: 'healthy', latency: '45ms', icon: Zap, uptime: '99.90%' },
  { label: 'Storage CDN', status: 'healthy', latency: '22ms', icon: HardDrive, uptime: '99.97%' },
  { label: 'API Gateway', status: 'healthy', latency: '15ms', icon: Clock, uptime: '99.99%' },
];

export function SystemHealth() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.35 }}
      className="rounded-xl border border-border/50 bg-card"
    >
      <div className="flex items-center justify-between border-b border-border/50 px-4 py-3">
        <h3 className="text-[13px] font-semibold text-white">System Health</h3>
        <span className="flex items-center gap-1 rounded-full bg-green-500/10 px-2 py-0.5 text-[10px] font-bold text-green-400">
          ALL SYSTEMS OPERATIONAL
        </span>
      </div>

      <div className="divide-y divide-border/20">
        {HEALTH_ITEMS.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.label} className="flex items-center justify-between px-4 py-3">
              <div className="flex items-center gap-2.5">
                <Icon className="h-3.5 w-3.5 text-muted-foreground" />
                <span className="text-[12px] text-white">{item.label}</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="text-[11px] font-mono text-muted-foreground">{item.latency}</span>
                <span className="text-[11px] text-muted-foreground">{item.uptime}</span>
                <span
                  className={cn(
                    'h-2 w-2 rounded-full',
                    item.status === 'healthy' ? 'bg-green-400' : item.status === 'degraded' ? 'bg-yellow-400' : 'bg-red-400'
                  )}
                />
              </div>
            </div>
          );
        })}
      </div>
    </motion.div>
  );
}
