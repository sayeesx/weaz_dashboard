'use client';

import { Sidebar, Header, CommandPalette, NotificationPanel } from '@/components/layout';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';
import { useEffect } from 'react';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="flex min-h-screen bg-background w-full overflow-x-hidden">
      <Sidebar />
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300 w-full min-w-0 max-w-[100vw]',
          sidebarCollapsed ? 'lg:ml-[68px]' : 'lg:ml-[240px]'
        )}
      >
        <Header />
        <main className="flex-1 w-full overflow-x-hidden no-scrollbar pb-20 lg:pb-0">{children}</main>
      </div>
      <CommandPalette />
      <NotificationPanel />
    </div>
  );
}
