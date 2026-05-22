'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { X, Bell, Check, Trash2 } from 'lucide-react';
import { useUIStore } from '@/store';
import { timeAgo } from '@/lib/utils';

// Mock notifications — will be replaced by realtime subscription
const MOCK_NOTIFICATIONS = [
  { id: '1', title: 'New high-priority order', body: 'Order WZ-3F2K received from Kerala Medical Center', type: 'order', is_read: false, created_at: new Date(Date.now() - 120000).toISOString() },
  { id: '2', title: 'Low stock alert', body: 'Paracetamol 500mg below threshold (12 units)', type: 'inventory', is_read: false, created_at: new Date(Date.now() - 3600000).toISOString() },
  { id: '3', title: 'Delivery partner offline', body: 'Rajesh K. went offline at 2:30 PM', type: 'delivery', is_read: true, created_at: new Date(Date.now() - 7200000).toISOString() },
  { id: '4', title: 'Payment settled', body: 'Daily settlement of ₹42,350 processed', type: 'finance', is_read: true, created_at: new Date(Date.now() - 14400000).toISOString() },
];

export function NotificationPanel() {
  const { notificationPanelOpen, setNotificationPanelOpen } = useUIStore();

  return (
    <AnimatePresence>
      {notificationPanelOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/40"
            onClick={() => setNotificationPanelOpen(false)}
          />
          <motion.div
            initial={{ x: '100%' }}
            animate={{ x: 0 }}
            exit={{ x: '100%' }}
            transition={{ type: 'spring', bounce: 0.1, duration: 0.45 }}
            className="fixed right-0 top-0 z-50 h-screen w-full max-w-[380px] border-l border-border/50 bg-card shadow-2xl"
          >
            {/* Header */}
            <div className="flex items-center justify-between border-b border-border/50 px-5 py-4">
              <div className="flex items-center gap-2">
                <Bell className="h-4 w-4 text-muted-foreground" />
                <h2 className="text-sm font-semibold text-white">Notifications</h2>
                <span className="rounded-full bg-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400">
                  {MOCK_NOTIFICATIONS.filter((n) => !n.is_read).length}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-white">
                  <Check className="h-3.5 w-3.5" />
                </button>
                <button className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-white">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
                <button
                  onClick={() => setNotificationPanelOpen(false)}
                  className="rounded-lg p-1.5 text-muted-foreground hover:bg-muted/40 hover:text-white"
                >
                  <X className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto" style={{ height: 'calc(100vh - 60px)' }}>
              {MOCK_NOTIFICATIONS.map((n) => (
                <div
                  key={n.id}
                  className={`border-b border-border/30 px-5 py-3.5 transition-colors hover:bg-muted/20 ${!n.is_read ? 'bg-white/[0.02]' : ''}`}
                >
                  <div className="flex items-start gap-3">
                    {!n.is_read && (
                      <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-blue-500" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-[13px] font-medium text-white leading-snug">{n.title}</p>
                      <p className="mt-0.5 text-[12px] text-muted-foreground leading-snug">{n.body}</p>
                      <p className="mt-1.5 text-[10px] text-muted-foreground/60">{timeAgo(n.created_at)}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
