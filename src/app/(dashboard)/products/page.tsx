'use client';

import { useQuery } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Package, Loader2 } from 'lucide-react';
import type { Product } from '../catalog/products/page';

export default function ProductsPage() {
  const supabase = createClient();

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products_display'],
    queryFn: async () => {
      const { data } = await supabase
        .from('products')
        .select('*, categories(title)')
        .eq('visibility', true)
        .order('created_at', { ascending: false });
      return (data as Product[]) ?? [];
    },
  });

  return (
    <div className="flex h-full flex-col bg-background">
      <div className="border-b border-border/50 px-6 py-5">
        <h1 className="text-lg font-bold text-white">Live Products Hub</h1>
        <p className="mt-1 text-[12px] text-muted-foreground">Beautiful overview of all active products serving your catalog.</p>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 border-t md:border-t-0">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 text-muted-foreground">
            <Package className="h-10 w-10 opacity-30 mb-2" />
            <p className="text-[12px]">No live products found.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 md:gap-6">
            {products.map((p) => (
              <div key={p.id} className="group relative flex flex-col overflow-hidden rounded-2xl border border-border/50 bg-card/40 transition-all hover:bg-card hover:border-white/20">
                <div className="aspect-[4/3] w-full bg-muted overflow-hidden">
                  {p.cloudinary_image_url ? (
                    <img src={p.cloudinary_image_url} alt={p.title} className="h-full w-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  ) : (
                    <div className="flex h-full items-center justify-center"><Package className="h-8 w-8 text-white/10" /></div>
                  )}
                  {p.is_trending && (
                    <span className="absolute top-2 left-2 rounded-full bg-orange-500/90 px-2 py-0.5 text-[9px] font-bold uppercase text-white shadow">Trending</span>
                  )}
                  {p.discount && p.discount > 0 ? (
                    <span className="absolute top-2 right-2 rounded-full bg-red-500/90 px-2 py-0.5 text-[9px] font-bold uppercase text-white shadow">{p.discount}% OFF</span>
                  ) : null}
                </div>
                
                <div className="flex flex-1 flex-col p-4">
                  <div className="mb-1 uppercase tracking-wider text-[9px] font-bold text-emerald-500">{p.categories?.title ?? 'Uncategorized'}</div>
                  <h3 className="text-[13px] font-bold leading-tight text-white line-clamp-2 mb-1">{p.title}</h3>
                  {p.subtitle && <p className="text-[10px] text-muted-foreground line-clamp-1 mb-3">{p.subtitle}</p>}
                  
                  <div className="mt-auto pt-3 flex items-center justify-between border-t border-border/50">
                    <div className="flex flex-col">
                      <span className="text-[14px] font-bold text-white tabular-nums">₹{p.price.toFixed(2)}</span>
                      {p.mrp && p.mrp > p.price && (
                        <span className="text-[10px] text-muted-foreground line-through tabular-nums">₹{p.mrp.toFixed(2)}</span>
                      )}
                    </div>
                    <div className="flex flex-col items-end">
                      <span className="text-[10px] text-muted-foreground">{p.unit ?? '1 Unit'}</span>
                      {p.stock <= 5 ? (
                         <span className="text-[9px] text-red-400 font-bold">Only {p.stock} left</span>
                      ) : (
                         <span className="text-[9px] text-emerald-500 font-bold">In Stock</span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
