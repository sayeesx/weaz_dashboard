'use client';

import { useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { Command } from 'cmdk';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard, ShoppingCart, Package, Users, Truck, Warehouse,
  BarChart3, DollarSign, Settings, Search, X,
} from 'lucide-react';
import { useUIStore } from '@/store';

const COMMAND_ITEMS = [
  { label: 'Go to Dashboard',   href: '/dashboard',  icon: LayoutDashboard, group: 'Navigation' },
  { label: 'Go to Orders',      href: '/orders',     icon: ShoppingCart,    group: 'Navigation' },
  { label: 'Go to Products',    href: '/products',   icon: Package,         group: 'Navigation' },
  { label: 'Go to Customers',   href: '/customers',  icon: Users,           group: 'Navigation' },
  { label: 'Go to Delivery',    href: '/delivery',   icon: Truck,           group: 'Navigation' },
  { label: 'Go to Inventory',   href: '/inventory',  icon: Warehouse,       group: 'Navigation' },
  { label: 'Go to Analytics',   href: '/analytics',  icon: BarChart3,       group: 'Navigation' },
  { label: 'Go to Finance',     href: '/finance',     icon: DollarSign,      group: 'Navigation' },
  { label: 'Go to Settings',    href: '/settings',   icon: Settings,        group: 'Navigation' },
];

export function CommandPalette() {
  const router = useRouter();
  const { commandPaletteOpen, setCommandPaletteOpen } = useUIStore();

  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setCommandPaletteOpen(!commandPaletteOpen);
      }
      if (e.key === 'Escape') {
        setCommandPaletteOpen(false);
      }
    },
    [commandPaletteOpen, setCommandPaletteOpen]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  return (
    <AnimatePresence>
      {commandPaletteOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={() => setCommandPaletteOpen(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -20 }}
            transition={{ type: 'spring', bounce: 0.15, duration: 0.4 }}
            className="fixed left-1/2 top-[20%] z-50 w-full max-w-[560px] -translate-x-1/2 overflow-hidden rounded-xl border border-border/60 bg-card shadow-2xl"
          >
            <Command className="flex flex-col">
              {/* Input */}
              <div className="flex items-center gap-2.5 border-b border-border/50 px-4">
                <Search className="h-4 w-4 shrink-0 text-muted-foreground" />
                <Command.Input
                  placeholder="Type a command or search..."
                  className="h-12 flex-1 border-0 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
                  autoFocus
                />
                <button
                  onClick={() => setCommandPaletteOpen(false)}
                  className="flex h-5 w-5 items-center justify-center rounded border border-border/60 text-muted-foreground"
                >
                  <X className="h-3 w-3" />
                </button>
              </div>

              {/* List */}
              <Command.List className="max-h-[320px] overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-muted-foreground">
                  No results found
                </Command.Empty>

                <Command.Group heading="Navigation" className="[&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 [&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:font-semibold [&_[cmdk-group-heading]]:uppercase [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-muted-foreground/60">
                  {COMMAND_ITEMS.map((item) => {
                    const Icon = item.icon;
                    return (
                      <Command.Item
                        key={item.href}
                        value={item.label}
                        onSelect={() => {
                          router.push(item.href);
                          setCommandPaletteOpen(false);
                        }}
                        className="flex cursor-pointer items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] text-foreground transition-colors aria-selected:bg-white/[0.06]"
                      >
                        <Icon className="h-4 w-4 text-muted-foreground" />
                        {item.label}
                      </Command.Item>
                    );
                  })}
                </Command.Group>
              </Command.List>

              {/* Footer */}
              <div className="flex items-center justify-between border-t border-border/50 px-4 py-2">
                <span className="text-[10px] text-muted-foreground">Navigate with ↑↓ • Select with ↵</span>
                <span className="text-[10px] text-muted-foreground">ESC to close</span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
