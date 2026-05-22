'use client';

import { Sidebar, Header, CommandPalette, NotificationPanel } from '@/components/layout';
import { useUIStore } from '@/store';
import { cn } from '@/lib/utils';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const { sidebarCollapsed } = useUIStore();

  return (
    <div className="flex min-h-screen bg-background">
      <Sidebar />
      <div
        className={cn(
          'flex flex-1 flex-col transition-all duration-300',
          sidebarCollapsed ? 'ml-[68px]' : 'ml-[240px]'
        )}
      >
        <Header />
        <main className="flex-1">{children}</main>
      </div>
      <CommandPalette />
      <NotificationPanel />
    </div>
  );
}
