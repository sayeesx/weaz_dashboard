'use client';

import { Search, Bell, Command, Sparkles, User } from 'lucide-react';
import { useUIStore, useAuthStore } from '@/store';
import { cn, getInitials } from '@/lib/utils';

export function Header() {
  const { setCommandPaletteOpen, setNotificationPanelOpen, setAIPanelOpen, sidebarCollapsed } = useUIStore();
  const user = useAuthStore((s) => s.user);
  const role = useAuthStore((s) => s.role);

  return (
    <header
      className={cn(
        'sticky top-0 z-30 flex h-14 items-center justify-between border-b border-border/50 bg-background/80 px-6 backdrop-blur-xl transition-all duration-300',
        sidebarCollapsed ? 'ml-[68px]' : 'ml-[240px]'
      )}
    >
      {/* Search trigger */}
      <button
        onClick={() => setCommandPaletteOpen(true)}
        className="flex items-center gap-2.5 rounded-lg border border-border/50 bg-muted/40 px-3 py-1.5 text-[13px] text-muted-foreground transition-colors hover:border-border hover:bg-muted/60"
      >
        <Search className="h-3.5 w-3.5" />
        <span>Search anything...</span>
        <kbd className="ml-8 flex items-center gap-0.5 rounded border border-border/60 bg-background/60 px-1.5 py-0.5 text-[10px] font-medium text-muted-foreground">
          <Command className="h-2.5 w-2.5" />K
        </kbd>
      </button>

      {/* Right actions */}
      <div className="flex items-center gap-1">
        {/* AI assistant */}
        <button
          onClick={() => setAIPanelOpen(true)}
          className="flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-white"
          title="AI Assistant (⌘J)"
        >
          <Sparkles className="h-4 w-4" />
        </button>

        {/* Notifications */}
        <button
          onClick={() => setNotificationPanelOpen(true)}
          className="relative flex h-8 w-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-muted/60 hover:text-white"
          title="Notifications (⌘N)"
        >
          <Bell className="h-4 w-4" />
          <span className="absolute right-1.5 top-1.5 h-1.5 w-1.5 rounded-full bg-red-500" />
        </button>

        {/* Divider */}
        <div className="mx-2 h-6 w-px bg-border/50" />

        {/* User */}
        <button className="flex items-center gap-2.5 rounded-lg px-2 py-1 transition-colors hover:bg-muted/40">
          <div className="flex h-7 w-7 items-center justify-center rounded-full bg-white/10 text-[11px] font-bold text-white">
            {user ? getInitials(user.full_name || 'Admin') : <User className="h-3.5 w-3.5" />}
          </div>
          <div className="hidden text-left md:block">
            <p className="text-[12px] font-medium leading-tight text-white">
              {user?.full_name || 'Admin User'}
            </p>
            <p className="text-[10px] capitalize leading-tight text-muted-foreground">
              {role?.replace('_', ' ') || 'Platform Admin'}
            </p>
          </div>
        </button>
      </div>
    </header>
  );
}
