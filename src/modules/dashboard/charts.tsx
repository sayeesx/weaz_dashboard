'use client';

import { useState } from 'react';
import {
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, BarChart, Bar,
} from 'recharts';
import { motion } from 'framer-motion';

const HOURLY_DATA = Array.from({ length: 24 }, (_, i) => ({
  hour: `${i.toString().padStart(2, '0')}:00`,
  orders: Math.floor(20 + Math.random() * 80),
  revenue: Math.floor(15000 + Math.random() * 85000),
}));

const DAILY_DATA = Array.from({ length: 30 }, (_, i) => ({
  day: `May ${(i + 1).toString().padStart(2, '0')}`,
  orders: Math.floor(800 + Math.random() * 600),
  revenue: Math.floor(1500000 + Math.random() * 1500000),
}));

type TimeRange = 'hourly' | 'daily' | 'weekly' | 'monthly';

const TIME_RANGES: { label: string; value: TimeRange }[] = [
  { label: 'Hourly', value: 'hourly' },
  { label: 'Daily', value: 'daily' },
  { label: 'Weekly', value: 'weekly' },
  { label: 'Monthly', value: 'monthly' },
];

const CustomTooltip = ({ active, payload, label }: { active?: boolean; payload?: Array<{ value: number; name: string }>; label?: string }) => {
  if (!active || !payload) return null;
  return (
    <div className="rounded-lg border border-border/60 bg-card px-3 py-2 shadow-xl">
      <p className="text-[11px] font-medium text-muted-foreground">{label}</p>
      {payload.map((p, i) => (
        <p key={i} className="text-[12px] font-semibold text-white">
          {p.name}: {p.value.toLocaleString('en-IN')}
        </p>
      ))}
    </div>
  );
};

export function DashboardCharts() {
  const [timeRange, setTimeRange] = useState<TimeRange>('hourly');
  const data = timeRange === 'hourly' ? HOURLY_DATA : DAILY_DATA;

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: 0.2 }}
      className="grid grid-cols-1 gap-4 lg:grid-cols-2"
    >
      {/* Revenue Area Chart */}
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <div className="mb-4 flex items-center justify-between">
          <div>
            <h3 className="text-[13px] font-semibold text-white">Revenue Trend</h3>
            <p className="text-[11px] text-muted-foreground">Gross revenue over time</p>
          </div>
          <div className="flex rounded-lg border border-border/50 bg-muted/30 p-0.5">
            {TIME_RANGES.map((range) => (
              <button
                key={range.value}
                onClick={() => setTimeRange(range.value)}
                className={`rounded-md px-2.5 py-1 text-[11px] font-medium transition-colors ${
                  timeRange === range.value
                    ? 'bg-white/10 text-white'
                    : 'text-muted-foreground hover:text-white'
                }`}
              >
                {range.label}
              </button>
            ))}
          </div>
        </div>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={data as Array<Record<string, unknown>>}>
              <defs>
                <linearGradient id="revenueGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#ffffff" stopOpacity={0.15} />
                  <stop offset="100%" stopColor="#ffffff" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey={timeRange === 'hourly' ? 'hour' : 'day'}
                tick={{ fontSize: 10, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
                tickFormatter={(v: number) => `₹${(v / 1000).toFixed(0)}K`}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="revenue"
                stroke="#ffffff"
                strokeWidth={1.5}
                fill="url(#revenueGrad)"
                animationDuration={800}
              />
            </AreaChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Orders Bar Chart */}
      <div className="rounded-xl border border-border/50 bg-card p-4">
        <div className="mb-4">
          <h3 className="text-[13px] font-semibold text-white">Order Volume</h3>
          <p className="text-[11px] text-muted-foreground">Orders processed over time</p>
        </div>
        <div className="h-[240px]">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={data as Array<Record<string, unknown>>}>
              <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
              <XAxis
                dataKey={timeRange === 'hourly' ? 'hour' : 'day'}
                tick={{ fontSize: 10, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 10, fill: '#71717a' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} />
              <Bar
                dataKey="orders"
                fill="rgba(255,255,255,0.12)"
                radius={[4, 4, 0, 0]}
                animationDuration={800}
              />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>
    </motion.div>
  );
}
