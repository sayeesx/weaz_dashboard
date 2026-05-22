'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, Package, Users, Truck, Warehouse,
  BarChart3, DollarSign, Megaphone, HeadphonesIcon, Settings, Server,
  Activity, Flag, Bot, ChevronLeft, ChevronRight, Zap, Radio, Navigation, AlertOctagon, Search, ShieldCheck, Receipt, TestTube, LibraryBig
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useUIStore } from '@/store';
import { useAuthStore } from '@/store';
import { ROUTE_PERMISSIONS } from '@/permissions';
import type { AdminRole } from '@/types';

const NAV_ITEMS = [
  { label: 'Dashboard',  href: '/dashboard',  icon: LayoutDashboard, group: 'core' },
  { label: 'Orders',     href: '/orders',     icon: ShoppingCart,    group: 'core' },
  { label: 'Products',   href: '/products',   icon: Package,         group: 'core' },
  { label: 'Customers',  href: '/customers',  icon: Users,           group: 'core' },
  { label: 'Live Map',   href: '/live',       icon: Radio,           group: 'operations' },
  { label: 'Dispatch',   href: '/dispatch',   icon: Navigation,      group: 'operations' },
  { label: 'Delivery',   href: '/delivery',   icon: Truck,           group: 'operations' },
  { label: 'Inventory',  href: '/inventory',  icon: Warehouse,       group: 'operations' },
  { label: 'Incidents',  href: '/incidents',  icon: AlertOctagon,    group: 'operations' },
  { label: 'Analytics',  href: '/analytics',  icon: BarChart3,       group: 'intelligence' },
  { label: 'Finance',    href: '/finance',     icon: DollarSign,      group: 'intelligence' },
  { label: 'Unit Cost',  href: '/finance/cost', icon: Receipt,       group: 'intelligence' },
  { label: 'Marketing',  href: '/marketing',  icon: Megaphone,       group: 'engagement' },
  { label: 'Support',    href: '/support',     icon: HeadphonesIcon,  group: 'engagement' },
  { label: 'Ops Center', href: '/ops',         icon: Activity,        group: 'system' },
  { label: 'Experiments',href: '/experiments', icon: TestTube,        group: 'system' },
  { label: 'Flags',      href: '/flags',       icon: Flag,            group: 'system' },
  { label: 'Search',     href: '/system/search', icon: Search,        group: 'system' },
  { label: 'Governance', href: '/system/governance', icon: ShieldCheck, group: 'system' },
  { label: 'Decision Log', href: '/system/decisions', icon: LibraryBig, group: 'system' },
  { label: 'System',     href: '/system',      icon: Server,          group: 'system' },
  { label: 'Settings',   href: '/settings',    icon: Settings,        group: 'system' },
];

const GROUP_LABELS: Record<string, string> = {
  core: 'Core',
  operations: 'Operations',
  intelligence: 'Intelligence',
  engagement: 'Engagement',
  system: 'System',
};

export function Sidebar() {
  const pathname = usePathname();
  const { sidebarCollapsed, collapseSidebar, expandSidebar } = useUIStore();
  const role = useAuthStore((s) => s.role) || 'platform_admin';

  const filteredItems = NAV_ITEMS.filter((item) => {
    const allowedRoles = ROUTE_PERMISSIONS[item.href];
    return !allowedRoles || allowedRoles.includes(role as AdminRole);
  });

  const groups = filteredItems.reduce<Record<string, typeof NAV_ITEMS>>((acc, item) => {
    if (!acc[item.group]) acc[item.group] = [];
    acc[item.group].push(item);
    return acc;
  }, {});

  return (
    <aside
      className={cn(
        'fixed left-0 top-0 z-40 h-screen flex flex-col border-r border-border/50 bg-sidebar transition-all duration-300 ease-out',
        sidebarCollapsed ? 'w-[68px]' : 'w-[240px]'
      )}
    >
      {/* Logo */}
      <div className="flex h-14 items-center gap-2.5 border-b border-border/50 px-4">
        <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-white/10">
          <Zap className="h-4 w-4 text-white" />
        </div>
        <AnimatePresence>
          {!sidebarCollapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: 'auto' }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden"
            >
              <span className="text-sm font-bold tracking-widest text-white">WEAZ</span>
              <span className="ml-1.5 text-[10px] font-medium text-muted-foreground">ADMIN</span>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto overflow-x-hidden py-3 px-2.5">
        {Object.entries(groups).map(([group, items]) => (
          <div key={group} className="mb-4">
            {!sidebarCollapsed && (
              <span className="mb-1.5 block px-2 text-[10px] font-semibold uppercase tracking-[0.15em] text-muted-foreground/60">
                {GROUP_LABELS[group]}
              </span>
            )}
            {items.map((item) => {
              const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
              const Icon = item.icon;
              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={cn(
                    'group relative flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-all duration-150',
                    isActive
                      ? 'bg-white/[0.08] text-white'
                      : 'text-sidebar-foreground hover:bg-white/[0.04] hover:text-white'
                  )}
                >
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-lg bg-white/[0.08]"
                      transition={{ type: 'spring', bounce: 0.15, duration: 0.5 }}
                    />
                  )}
                  <Icon className={cn('relative z-10 h-4 w-4 shrink-0', isActive ? 'text-white' : 'text-muted-foreground group-hover:text-white')} />
                  {!sidebarCollapsed && (
                    <span className="relative z-10 truncate">{item.label}</span>
                  )}
                </Link>
              );
            })}
          </div>
        ))}
      </nav>

      {/* Collapse toggle */}
      <div className="border-t border-border/50 p-2.5">
        <button
          onClick={() => (sidebarCollapsed ? expandSidebar() : collapseSidebar())}
          className="flex w-full items-center justify-center rounded-lg p-2 text-muted-foreground transition-colors hover:bg-white/[0.04] hover:text-white"
        >
          {sidebarCollapsed ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </button>
      </div>
    </aside>
  );
}
