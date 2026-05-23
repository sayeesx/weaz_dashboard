'use client';

import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import {
  Plus, Pencil, Trash2, Eye, EyeOff, Copy, X, Loader2, Check,
  GripVertical, ChevronUp, ChevronDown, Calendar, LayoutGrid,
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { ProductDrawer, Product, Category, Brand } from '../products/page';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);

function SectionProductsManager({ section, onClose }: { section: Section; onClose: () => void }) {
  const qc = useQueryClient();
  const [drawerOpen, setDrawerOpen] = useState(false);
  
  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => { const { data } = await supabase.from('products').select('*').order('created_at', { ascending: false }); return data as Product[]; }
  });
  const { data: sectionProducts = [] } = useQuery({
    queryKey: ['home_section_products', section.id],
    queryFn: async () => { const { data } = await supabase.from('home_section_products').select('product_id').eq('section_id', section.id); return (data || []).map(d => d.product_id); },
    enabled: section.product_source === 'manual' || section.product_source === 'category'
  });
  
  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const { data } = await supabase.from('categories').select('*').order('title'); return data as Category[]; },
  });
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => { const { data } = await supabase.from('brands').select('*').order('name'); return data as Brand[]; },
  });

  const toggle = async (p: Product) => {
    if (section.product_source === 'featured') {
      await supabase.from('products').update({ is_featured: !p.is_featured }).eq('id', p.id);
      qc.invalidateQueries({ queryKey: ['products'] });
    } else if (section.product_source === 'trending') {
      await supabase.from('products').update({ is_trending: !p.is_trending }).eq('id', p.id);
      qc.invalidateQueries({ queryKey: ['products'] });
    } else if (section.product_source === 'popular') {
      await supabase.from('products').update({ is_featured: !p.is_featured }).eq('id', p.id);
      qc.invalidateQueries({ queryKey: ['products'] });
    } else {
      const isSelected = sectionProducts.includes(p.id);
      if (isSelected) {
        await supabase.from('home_section_products').delete().eq('section_id', section.id).eq('product_id', p.id);
      } else {
        await supabase.from('home_section_products').insert({ section_id: section.id, product_id: p.id, sort_order: 0 });
      }
      qc.invalidateQueries({ queryKey: ['home_section_products', section.id] });
    }
  };

  const isSelected = (p: Product) => {
    if (section.product_source === 'featured' || section.product_source === 'popular') return p.is_featured;
    if (section.product_source === 'trending') return p.is_trending;
    return sectionProducts.includes(p.id);
  };

  return (
    <div className="fixed inset-0 z-40 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-full w-full max-w-[800px] flex-col rounded-xl border border-border/50 bg-background shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <div>
            <h3 className="text-[14px] font-bold text-white">Manage Products</h3>
            <p className="text-[11px] text-muted-foreground mt-1">Section: {section.title_en} ({section.product_source})</p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => setDrawerOpen(true)} className="rounded-lg bg-white px-3 py-1.5 text-[11px] font-semibold text-black hover:bg-white/90">
              <Plus className="h-3.5 w-3.5 inline mr-1" /> New Product
            </button>
            <button onClick={onClose} className="rounded p-1.5 text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-2">
          {products.map(p => (
            <div key={p.id} className="flex items-center justify-between rounded-lg border border-border/30 bg-card/30 px-4 py-2 hover:bg-card/50 transition-colors">
              <div className="flex items-center gap-3">
                <img src={p.cloudinary_image_url || '/placeholder.png'} className="h-8 w-8 rounded-md bg-muted object-cover" />
                <div>
                  <p className="text-[12px] font-medium text-white">{p.title}</p>
                  <p className="text-[10px] text-muted-foreground">₹{p.price}</p>
                </div>
              </div>
              <button onClick={() => toggle(p)} className={cn("rounded-lg px-3 py-1.5 text-[11px] font-semibold transition-colors", isSelected(p) ? 'bg-green-500/20 text-green-400' : 'bg-white/10 text-white hover:bg-white/20')}>
                {isSelected(p) ? 'Added' : 'Add'}
              </button>
            </div>
          ))}
        </div>
      </div>
      {drawerOpen && (
        <ProductDrawer 
          product={null} 
          categories={categories} 
          brands={brands} 
          onClose={() => setDrawerOpen(false)} 
          onSaved={() => { qc.invalidateQueries({ queryKey: ['products'] }); setDrawerOpen(false); }} 
        />
      )}
    </div>
  );
}

interface Section {
  id: string; type: string; title_en: string; title_ar: string;
  subtitle_en: string | null; sort_order: number; is_visible: boolean;
  is_scheduled: boolean; scheduled_on: string | null; scheduled_off: string | null;
  product_source: string; display_limit: number; sort_by: string;
  bg_style: string; lottie_url: string | null; cover_url: string | null;
  category_id: string | null; config: Record<string, unknown>;
}

const SECTION_TYPES = [
  { value: 'product_rail',    label: 'Product Rail' },
  { value: 'category_grid',   label: 'Category Grid' },
  { value: 'banner_carousel', label: 'Banner Carousel' },
  { value: 'custom',          label: 'Custom' },
];
const PRODUCT_SOURCES = [
  { value: 'featured',        label: 'Featured' },
  { value: 'trending',        label: 'Trending' },
  { value: 'recently_bought', label: 'Recently Bought' },
  { value: 'recommended',     label: 'Recommended' },
  { value: 'manual',          label: 'Manual pick' },
  { value: 'category',        label: 'By Category' },
];

function SectionModal({ section, onClose, onSaved }: { section: Section | null; onClose: () => void; onSaved: () => void }) {
  const [form, setForm] = useState({
    type:           section?.type           ?? 'product_rail',
    title_en:       section?.title_en       ?? '',
    title_ar:       section?.title_ar       ?? '',
    subtitle_en:    section?.subtitle_en    ?? '',
    product_source: section?.product_source ?? 'featured',
    display_limit:  section?.display_limit  ?? 10,
    sort_by:        section?.sort_by        ?? 'manual',
    bg_style:       section?.bg_style       ?? 'default',
    is_visible:     section?.is_visible     ?? true,
    is_scheduled:   section?.is_scheduled   ?? false,
    scheduled_on:   section?.scheduled_on   ?? '',
    scheduled_off:  section?.scheduled_off  ?? '',
    lottie_url:     section?.lottie_url     ?? '',
    cover_url:      section?.cover_url      ?? '',
  });
  const [saving, setSaving] = useState(false);
  const set = (k: keyof typeof form, v: unknown) => setForm(f => ({ ...f, [k]: v }));

  const save = async () => {
    if (!form.title_en) return; setSaving(true);
    const payload = {
      ...form,
      subtitle_en:  form.subtitle_en  || null,
      scheduled_on: form.scheduled_on || null,
      scheduled_off: form.scheduled_off || null,
      lottie_url:   form.lottie_url   || null,
      cover_url:    form.cover_url    || null,
      updated_at:   new Date().toISOString(),
    };
    if (section) await supabase.from('home_sections').update(payload).eq('id', section.id);
    else         await supabase.from('home_sections').insert({ ...payload, sort_order: 99 });
    setSaving(false); onSaved(); onClose();
  };

  const F = ({ label, children }: { label: string; children: React.ReactNode }) => (
    <div className="flex flex-col gap-1.5">
      <label className="text-[11px] font-medium text-muted-foreground">{label}</label>
      {children}
    </div>
  );
  const inp = 'h-9 w-full rounded-lg border border-border/50 bg-muted/30 px-3 text-[12px] text-white outline-none focus:border-white/30';
  const sel = 'h-9 w-full rounded-lg border border-border/50 bg-muted/30 px-3 text-[12px] text-white outline-none';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex max-h-full w-full max-w-[600px] flex-col rounded-xl border border-border/50 bg-background shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <h3 className="text-[14px] font-bold text-white">{section ? 'Edit Section' : 'New Section'}</h3>
          <button onClick={onClose} className="rounded p-1.5 text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="flex-1 overflow-y-auto space-y-4 px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="Section Type">
              <select value={form.type} onChange={e => set('type', e.target.value)} className={sel}>
                {SECTION_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </F>
            <F label="Product Source">
              <select value={form.product_source} onChange={e => set('product_source', e.target.value)} className={sel}>
                {PRODUCT_SOURCES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
              </select>
            </F>
          </div>
          <F label="Title (English) *">
            <input value={form.title_en} onChange={e => set('title_en', e.target.value)} placeholder="Featured Products" className={inp} />
          </F>
          <F label="Title (Arabic)">
            <input value={form.title_ar} onChange={e => set('title_ar', e.target.value)} placeholder="المنتجات المميزة" dir="rtl" className={inp} />
          </F>
          <F label="Subtitle">
            <input value={form.subtitle_en} onChange={e => set('subtitle_en', e.target.value)} placeholder="Optional subtitle" className={inp} />
          </F>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="Display Limit">
              <input type="number" value={form.display_limit} onChange={e => set('display_limit', parseInt(e.target.value)||10)} className={inp} />
            </F>
            <F label="Sort By">
              <select value={form.sort_by} onChange={e => set('sort_by', e.target.value)} className={sel}>
                {['manual','price_asc','price_desc','newest','popular'].map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </F>
          </div>
          <F label="Background Style">
            <select value={form.bg_style} onChange={e => set('bg_style', e.target.value)} className={sel}>
              {['default','cream','dark','gradient'].map(s => <option key={s} value={s}>{s}</option>)}
            </select>
          </F>
          <F label="Lottie URL (optional)">
            <input value={form.lottie_url} onChange={e => set('lottie_url', e.target.value)} placeholder="https://..." className={inp} />
          </F>
          <F label="Cover Image URL (optional)">
            <input value={form.cover_url} onChange={e => set('cover_url', e.target.value)} placeholder="https://..." className={inp} />
          </F>

          {/* Flags */}
          <div className="flex flex-wrap gap-2 pt-1">
            {[
              { field: 'is_visible' as const,   label: 'Visible' },
              { field: 'is_scheduled' as const, label: 'Scheduled' },
            ].map(({ field, label }) => (
              <button key={field} type="button" onClick={() => set(field, !form[field])}
                className={cn('flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] font-medium transition-colors',
                  form[field] ? 'bg-green-500/20 text-green-400' : 'bg-card/60 text-muted-foreground')}>
                {form[field] ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
                {label}
              </button>
            ))}
          </div>

          {form.is_scheduled && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 rounded-lg border border-border/50 bg-muted/10 p-4">
              <F label="Show from">
                <input type="datetime-local" value={form.scheduled_on} onChange={e => set('scheduled_on', e.target.value)} className={inp} />
              </F>
              <F label="Hide after">
                <input type="datetime-local" value={form.scheduled_off} onChange={e => set('scheduled_off', e.target.value)} className={inp} />
              </F>
            </div>
          )}
        </div>
        <div className="flex justify-end gap-3 border-t border-border/50 px-6 py-4">
          <button onClick={onClose} className="px-4 py-2 text-[12px] text-muted-foreground hover:text-white">Cancel</button>
          <button onClick={save} disabled={saving || !form.title_en}
            className="flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-[12px] font-semibold text-black disabled:opacity-50">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {section ? 'Save Changes' : 'Create Section'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function SectionsPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; section: Section | null }>({ open: false, section: null });
  const [managerOpen, setManagerOpen] = useState<Section | null>(null);

  const { data: sections = [], isLoading } = useQuery({
    queryKey: ['home_sections'],
    queryFn: async () => { const { data } = await supabase.from('home_sections').select('*').order('sort_order'); return (data as Section[]) ?? []; },
  });

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, v }: { id: string; v: boolean }) => {
      const { data, error } = await supabase.from('home_sections').update({ is_visible: !v, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['home_sections'] }),
  });

  const duplicate = useMutation({
    mutationFn: async (s: Section) => {
      const { id, created_at, updated_at, ...rest } = s as Section & { created_at?: string; updated_at?: string };
      void id; void created_at; void updated_at;
      await supabase.from('home_sections').insert({ ...rest, title_en: rest.title_en + ' (Copy)', sort_order: rest.sort_order + 1 });
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['home_sections'] }),
  });

  const moveSection = useMutation({
    mutationFn: async ({ id, dir, currentOrder }: { id: string; dir: 'up' | 'down'; currentOrder: number }) => {
      const newOrder = dir === 'up' ? currentOrder - 1 : currentOrder + 1;
      await supabase.from('home_sections').update({ sort_order: newOrder, updated_at: new Date().toISOString() }).eq('id', id);
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['home_sections'] }),
  });

  const del = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from('home_sections').delete().eq('id', id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['home_sections'] }),
  });

  const typeIcon = (type: string) => type === 'banner_carousel' ? '🎞️' : type === 'category_grid' ? '⊞' : type === 'custom' ? '✦' : '▬';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-3">
        <div>
          <h2 className="text-[14px] font-bold text-white">Home Sections</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">Drag or use arrows to reorder. Changes reflect live in app.</p>
        </div>
        <button onClick={() => setModal({ open: true, section: null })}
          className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-[12px] font-semibold text-black hover:bg-white/90">
          <Plus className="h-3.5 w-3.5" /> New Section
        </button>
      </div>

      <div className="flex-1 overflow-y-auto divide-y divide-border/30">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : sections.map((s, i) => (
          <div key={s.id} className={cn('flex items-center gap-4 px-6 py-3 hover:bg-white/[0.02] transition-colors', !s.is_visible && 'opacity-50')}>
            {/* Sort handle */}
            <div className="flex flex-col gap-0.5">
              <button onClick={() => i > 0 && moveSection.mutate({ id: s.id, dir: 'up', currentOrder: s.sort_order })}
                disabled={i === 0} className="text-muted-foreground/40 hover:text-white disabled:opacity-20">
                <ChevronUp className="h-3 w-3" />
              </button>
              <button onClick={() => i < sections.length - 1 && moveSection.mutate({ id: s.id, dir: 'down', currentOrder: s.sort_order })}
                disabled={i === sections.length - 1} className="text-muted-foreground/40 hover:text-white disabled:opacity-20">
                <ChevronDown className="h-3 w-3" />
              </button>
            </div>

            {/* Order chip */}
            <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-lg bg-muted text-[11px] font-bold text-muted-foreground">
              {i + 1}
            </div>

            {/* Type icon */}
            <span className="text-[18px]">{typeIcon(s.type)}</span>

            {/* Info */}
            <div className="min-w-0 flex-1">
              <p className="text-[13px] font-medium text-white">{s.title_en}</p>
              <div className="mt-0.5 flex items-center gap-2 text-[10px] text-muted-foreground">
                <span className="capitalize">{s.type.replace('_', ' ')}</span>
                <span>·</span>
                <span>{s.product_source}</span>
                <span>·</span>
                <span>max {s.display_limit}</span>
                {s.is_scheduled && <span className="flex items-center gap-0.5 text-amber-400"><Calendar className="h-2.5 w-2.5" /> Scheduled</span>}
              </div>
            </div>

            {/* Status badge */}
            <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase',
              s.is_visible ? 'bg-green-500/10 text-green-400' : 'bg-muted text-muted-foreground')}>
              {s.is_visible ? 'Live' : 'Hidden'}
            </span>

            {/* Actions */}
            <div className="flex shrink-0 items-center gap-1">
              {['product_rail', 'category_grid'].includes(s.type) && (
                <button onClick={() => setManagerOpen(s)} className="rounded-lg bg-white/10 px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-white/20 mr-2">
                  Manage Products
                </button>
              )}
              <button onClick={() => setModal({ open: true, section: s })} className="rounded p-1.5 text-muted-foreground hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
              <button onClick={() => toggleVisibility.mutate({ id: s.id, v: s.is_visible })} className="rounded p-1.5 text-muted-foreground hover:text-white">
                {s.is_visible ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              </button>
              <button onClick={() => duplicate.mutate(s)} className="rounded p-1.5 text-muted-foreground hover:text-white"><Copy className="h-3.5 w-3.5" /></button>
              <button onClick={() => { if(confirm('Delete section?')) del.mutate(s.id); }} className="rounded p-1.5 text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
            </div>
          </div>
        ))}
      </div>

      {modal.open && (
        <SectionModal section={modal.section} onClose={() => setModal({ open: false, section: null })} onSaved={() => qc.invalidateQueries({ queryKey: ['home_sections'] })} />
      )}
      {managerOpen && (
        <SectionProductsManager section={managerOpen} onClose={() => setManagerOpen(null)} />
      )}
    </div>
  );
}
