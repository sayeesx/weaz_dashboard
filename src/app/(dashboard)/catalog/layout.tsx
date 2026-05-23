'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { cn } from '@/lib/utils';
import { Package, Tag, Image as ImageIcon, LayoutGrid, FolderOpen, Library } from 'lucide-react';

const CATALOG_TABS = [
  { label: 'Products',   href: '/catalog/products',   icon: Package },
  { label: 'Categories', href: '/catalog/categories', icon: Tag },
  { label: 'Banners',    href: '/catalog/banners',    icon: ImageIcon },
  { label: 'Sections',   href: '/catalog/sections',   icon: LayoutGrid },
  { label: 'Media',      href: '/catalog/media',      icon: FolderOpen },
];

export default function CatalogLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();

  return (
    <div className="flex h-[calc(100vh-3.5rem)] flex-col">
      {/* Sub-nav */}
      <div className="flex items-center gap-1 border-b border-border/50 bg-card/40 px-6 pt-4 pb-0">
        <span className="mr-4 flex items-center gap-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
          <Library className="h-3.5 w-3.5" />
          Catalog
        </span>
        {CATALOG_TABS.map((tab) => {
          const Icon = tab.icon;
          const active = pathname.startsWith(tab.href);
          return (
            <Link
              key={tab.href}
              href={tab.href}
              className={cn(
                'flex items-center gap-1.5 border-b-2 px-4 py-2.5 text-[12px] font-medium transition-colors',
                active
                  ? 'border-white text-white'
                  : 'border-transparent text-muted-foreground hover:text-white'
              )}
            >
              <Icon className="h-3.5 w-3.5" />
              {tab.label}
            </Link>
          );
        })}
      </div>

      {/* Page content */}
      <div className="flex-1 overflow-auto">
        {children}
      </div>
    </div>
  );
}
