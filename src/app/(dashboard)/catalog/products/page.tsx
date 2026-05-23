'use client';

import { useState, useRef, useCallback } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import {
  Plus, Search, Package, Pencil, Trash2, Copy, Archive, RotateCcw,
  Eye, EyeOff, ChevronDown, Loader2, X, Upload, Check, ImageIcon,
  Minus, Tag, Star,
} from 'lucide-react';
import { cn } from '@/lib/utils';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

// ─── Types ────────────────────────────────────────────────────────────────────
export interface Category { id: string; slug: string; title: string; }
export interface Brand    { id: string; slug: string; name: string; }
export interface Product {
  id: string; slug: string; title: string; subtitle: string | null;
  description: string | null; price: number; mrp: number | null;
  discount: number | null; stock: number; unit: string | null;
  cloudinary_image_url: string | null; thumbnail_url: string | null;
  gallery_urls: string[] | null; is_featured: boolean; is_new: boolean;
  is_trending: boolean; visibility: boolean;
  brand_id: string | null; category_id: string | null; subcategory_id: string | null;
  sku: string | null; barcode: string | null; weight: number | null;
  dimensions: Record<string, number> | null; created_at: string;
  categories?: {title:string}; brands?: {name:string};
}

// ─── Upload helper ─────────────────────────────────────────────────────────────
async function uploadToCloudinary(file: File, folder = 'weaz/products'): Promise<string> {
  const res  = await fetch('/api/cloudinary/sign', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ folder }),
  });
  const { signature, timestamp, api_key } = await res.json();
  const fd = new FormData();
  fd.append('file', file); fd.append('api_key', api_key);
  fd.append('timestamp', String(timestamp)); fd.append('signature', signature);
  fd.append('folder', folder);
  const up = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, { method: 'POST', body: fd });
  const data = await up.json();
  if (!data.secure_url) throw new Error(data.error?.message || 'Upload failed');
  return data.secure_url;
}


// ─── Image Drop Zone ───────────────────────────────────────────────────────────
function ImageDropZone({ value, onChange, label = 'Drag image here' }: {
  value: string; onChange: (url: string) => void; label?: string;
}) {
  const [loading, setLoading] = useState(false);
  const [dragOver, setDragOver] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handle = async (file: File | null) => {
    if (!file) return;
    setLoading(true);
    try { 
      onChange(await uploadToCloudinary(file)); 
    }
    catch (e: unknown) { alert((e as Error).message); }
    setLoading(false);
  };

  return (
    <div
      onDrop={e => { e.preventDefault(); setDragOver(false); handle(e.dataTransfer.files[0]); }}
      onDragOver={e => { e.preventDefault(); setDragOver(true); }}
      onDragLeave={() => setDragOver(false)}
      onClick={() => ref.current?.click()}
      className={cn(
        'relative flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed transition-colors',
        value ? 'border-transparent' : dragOver ? 'border-white/40 bg-white/5' : 'border-border/40 hover:border-white/20',
        'aspect-square w-full overflow-hidden'
      )}
    >
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => handle(e.target.files?.[0] ?? null)} />
      {loading ? (
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      ) : value ? (
        <>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={value} alt="" className="h-full w-full object-cover" />
          <div className="absolute inset-0 flex items-center justify-center bg-black/60 opacity-0 hover:opacity-100 transition-opacity">
            <Upload className="h-5 w-5 text-white" />
          </div>
        </>
      ) : (
        <div className="flex flex-col items-center gap-1 p-4 text-center">
          <ImageIcon className="h-6 w-6 text-muted-foreground/40" />
          <p className="text-[10px] text-muted-foreground">{label}</p>
        </div>
      )}
    </div>
  );
}

// ─── Product Drawer ────────────────────────────────────────────────────────────
// ─── Product Drawer Components ──────────────────────────────────────────────────
const F = ({ label, children, required }: { label: string; children: React.ReactNode; required?: boolean }) => (
  <div className="flex flex-col gap-1.5">
    <label className="text-[11px] font-medium text-muted-foreground">{label}{required && <span className="ml-0.5 text-red-400">*</span>}</label>
    {children}
  </div>
);

const Input = (props: React.InputHTMLAttributes<HTMLInputElement> & { value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
  <input
    {...props}
    className="h-9 rounded-lg border border-border/50 bg-card/80 px-3 text-[12px] text-white outline-none focus:border-white/30 placeholder:text-muted-foreground/50"
  />
);

const Toggle = ({ value, onChange, label }: { value: boolean; onChange: () => void; label: string }) => (
  <button
    type="button"
    onClick={onChange}
    className={cn(
      'flex items-center gap-2 rounded-lg px-3 py-2 text-[11px] font-medium transition-colors',
      value ? 'bg-green-500/20 text-green-400' : 'bg-card/60 text-muted-foreground'
    )}
  >
    {value ? <Check className="h-3 w-3" /> : <X className="h-3 w-3" />}
    {label}
  </button>
);

const EMPTY_FORM = {
  title: '', subtitle: '', description: '', slug: '', sku: '', barcode: '',
  price: '', mrp: '', discount: '', stock: '', unit: '', weight: '',
  brand_id: '', category_id: '', subcategory_id: '',
  cloudinary_image_url: '', thumbnail_url: '', gallery_urls: [] as string[],
  is_featured: false, is_new: true, is_trending: false, visibility: true,
  tags: [] as string[], tagInput: '',
};

export function ProductDrawer({
  product, categories, brands, onClose, onSaved,
}: {
  product: Product | null; categories: Category[]; brands: Brand[];
  onClose: () => void; onSaved: () => void;
}) {
  const [form, setForm] = useState<typeof EMPTY_FORM>(() =>
    product ? {
      title: product.title, subtitle: product.subtitle ?? '', description: product.description ?? '',
      slug: product.slug, sku: product.sku ?? '', barcode: product.barcode ?? '',
      price: String(product.price), mrp: String(product.mrp ?? ''),
      discount: String(product.discount ?? ''), stock: String(product.stock),
      unit: product.unit ?? '', weight: String(product.weight ?? ''),
      brand_id: product.brand_id ?? '', category_id: product.category_id ?? '',
      subcategory_id: product.subcategory_id ?? '',
      cloudinary_image_url: product.cloudinary_image_url ?? '',
      thumbnail_url: product.thumbnail_url ?? '',
      gallery_urls: product.gallery_urls ?? [],
      is_featured: product.is_featured, is_new: product.is_new,
      is_trending: product.is_trending, visibility: product.visibility,
      tags: [], tagInput: '',
    } : { ...EMPTY_FORM }
  );
  const [saving, setSaving] = useState(false);
  const [galleryLoading, setGalleryLoading] = useState(false);
  const galleryRef = useRef<HTMLInputElement>(null);
  const qc = useQueryClient();

  const createBrand = async () => {
    const name = window.prompt("Enter new brand name:");
    if (!name?.trim()) return;
    const slug = name.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
    try {
      const { data, error } = await supabase.from('brands').insert({name: name.trim(), slug}).select('id').single();
      if (error) throw error;
      await qc.invalidateQueries({ queryKey: ['brands'] });
      set('brand_id', data.id);
    } catch(err: any) {
      alert(err.message || 'Failed to create brand');
    }
  };

  const set = (k: keyof typeof EMPTY_FORM, v: unknown) =>
    setForm(f => ({ ...f, [k]: v }));

  const addGallery = async (files: FileList | null) => {
    if (!files?.length) return;
    setGalleryLoading(true);
    try {
      const urls = await Promise.all(
        Array.from(files).map(f => uploadToCloudinary(f, 'weaz/products/gallery'))
      );
      set('gallery_urls', [...form.gallery_urls, ...urls]);
    } catch (e: unknown) { alert((e as Error).message); }
    setGalleryLoading(false);
  };

  const removeGallery = (url: string) =>
    set('gallery_urls', form.gallery_urls.filter(u => u !== url));

  const addTag = () => {
    const t = form.tagInput.trim().toLowerCase();
    if (t && !form.tags.includes(t)) set('tags', [...form.tags, t]);
    set('tagInput', '');
  };

  const save = async () => {
    if (!form.title || !form.price) return;
    setSaving(true);
    const payload = {
      title: form.title, subtitle: form.subtitle || null,
      description: form.description || null,
      slug: form.slug || form.title.toLowerCase().replace(/\s+/g, '-').replace(/[^a-z0-9-]/g, ''),
      sku: form.sku || null, barcode: form.barcode || null,
      price: parseFloat(form.price), mrp: form.mrp ? parseFloat(form.mrp) : null,
      discount: form.discount ? parseFloat(form.discount) : null,
      stock: parseInt(form.stock) || 0, unit: form.unit || null,
      weight: form.weight ? parseFloat(form.weight) : null,
      brand_id: form.brand_id || null, category_id: form.category_id || null,
      subcategory_id: form.subcategory_id || null,
      cloudinary_image_url: form.cloudinary_image_url || null,
      thumbnail_url: form.thumbnail_url || form.cloudinary_image_url || null,
      gallery_urls: form.gallery_urls.length ? form.gallery_urls : null,
      is_featured: form.is_featured, is_new: form.is_new,
      is_trending: form.is_trending, visibility: form.visibility,
      updated_at: new Date().toISOString(),
    };

    if (product) {
      await supabase.from('products').update(payload).eq('id', product.id);
    } else {
      const { data: inserted } = await supabase.from('products').insert(payload).select('id').single();
      // Insert tags
      if (inserted && form.tags.length) {
        await supabase.from('product_tags').insert(form.tags.map(tag => ({ product_id: inserted.id, tag })));
      }
    }
    setSaving(false);
    onSaved();
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-6">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-full w-full max-w-[900px] flex-col rounded-xl border border-border/50 bg-background shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <h2 className="text-[14px] font-bold text-white">
            {product ? 'Edit Product' : 'Create Product'}
          </h2>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:bg-white/5 hover:text-white">
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Form */}
        <div className="flex-1 overflow-y-auto px-6 py-5 space-y-5">
          {/* Images */}
          <div className="grid grid-cols-1 sm:grid-cols-[160px_1fr] gap-4">
            <F label="Main Image">
              <ImageDropZone value={form.cloudinary_image_url} onChange={v => set('cloudinary_image_url', v)} />
            </F>
            <F label="Gallery">
              <div className="flex flex-wrap gap-2">
                {form.gallery_urls.map(url => (
                  <div key={url} className="group relative h-16 w-16 overflow-hidden rounded-lg">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={url} alt="" className="h-full w-full object-cover" />
                    <button onClick={() => removeGallery(url)}
                      className="absolute right-0.5 top-0.5 hidden rounded bg-black/80 p-0.5 group-hover:flex">
                      <X className="h-2.5 w-2.5 text-white" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => galleryRef.current?.click()}
                  className="flex h-16 w-16 flex-col items-center justify-center rounded-lg border border-dashed border-border/50 hover:border-white/20 transition-colors"
                >
                  {galleryLoading ? <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /> : <Plus className="h-4 w-4 text-muted-foreground" />}
                </button>
                <input ref={galleryRef} type="file" multiple accept="image/*" className="hidden"
                  onChange={e => addGallery(e.target.files)} />
              </div>
            </F>
          </div>

          {/* Core fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="Product Name" required><Input value={form.title as string} onChange={e => set('title', e.target.value)} placeholder="e.g. Paracetamol 500mg" /></F>
            <F label="Slug"><Input value={form.slug as string} onChange={e => set('slug', e.target.value)} placeholder="auto-generated" /></F>
          </div>
          <F label="Subtitle"><Input value={form.subtitle as string} onChange={e => set('subtitle', e.target.value)} placeholder="Short descriptor" /></F>
          <F label="Description">
            <textarea
              rows={3}
              value={form.description}
              onChange={e => set('description', e.target.value)}
              placeholder="Detailed product description…"
              className="rounded-lg border border-border/50 bg-card/80 px-3 py-2 text-[12px] text-white outline-none resize-none focus:border-white/30 placeholder:text-muted-foreground/50"
            />
          </F>

          {/* Category / Brand */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="Category">
              <select value={form.category_id} onChange={e => set('category_id', e.target.value)}
                className="h-9 rounded-lg border border-border/50 bg-card/80 px-3 text-[12px] text-white outline-none">
                <option value="">— Select category —</option>
                {categories.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
              </select>
            </F>
            <F label="Brand">
              <div className="flex gap-2">
                <select value={form.brand_id} onChange={e => set('brand_id', e.target.value)}
                  className="h-9 flex-1 rounded-lg border border-border/50 bg-card/80 px-3 text-[12px] text-white outline-none">
                  <option value="">— Select brand —</option>
                  {brands.map(b => <option key={b.id} value={b.id}>{b.name}</option>)}
                </select>
                <button type="button" onClick={createBrand} className="h-9 rounded-lg bg-white/10 px-3 text-[11px] text-white hover:bg-white/15 whitespace-nowrap">
                  <Plus className="h-3.5 w-3.5 inline mr-1" /> New
                </button>
              </div>
            </F>
          </div>

          {/* Pricing */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <F label="Price (₹)" required><Input value={form.price as string} onChange={e => set('price', e.target.value)} type="number" placeholder="0.00" /></F>
            <F label="MRP (₹)"><Input value={form.mrp as string} onChange={e => set('mrp', e.target.value)} type="number" placeholder="0.00" /></F>
            <F label="Discount (%)"><Input value={form.discount as string} onChange={e => set('discount', e.target.value)} type="number" placeholder="0" /></F>
          </div>

          {/* Stock & Unit */}
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
            <F label="Stock"><Input value={form.stock as string} onChange={e => set('stock', e.target.value)} type="number" placeholder="0" /></F>
            <F label="Unit"><Input value={form.unit as string} onChange={e => set('unit', e.target.value)} placeholder="e.g. 10 Tablets" /></F>
            <F label="Weight (g)"><Input value={form.weight as string} onChange={e => set('weight', e.target.value)} type="number" placeholder="0" /></F>
          </div>

          {/* SKU / Barcode */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <F label="SKU"><Input value={form.sku as string} onChange={e => set('sku', e.target.value)} placeholder="WEAZ-001" /></F>
            <F label="Barcode"><Input value={form.barcode as string} onChange={e => set('barcode', e.target.value)} placeholder="EAN / UPC" /></F>
          </div>

          {/* Tags */}
          <F label="Tags">
            <div className="flex flex-wrap gap-1.5">
              {form.tags.map(t => (
                <span key={t} className="flex items-center gap-1 rounded-full bg-white/10 px-2 py-0.5 text-[10px] text-white">
                  {t}
                  <button onClick={() => set('tags', form.tags.filter(x => x !== t))}><X className="h-2.5 w-2.5" /></button>
                </span>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={form.tagInput}
                onChange={e => set('tagInput', e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); addTag(); }}}
                placeholder="Add tag, press Enter"
                className="h-8 flex-1 rounded-lg border border-border/50 bg-card/80 px-3 text-[12px] text-white outline-none focus:border-white/30 placeholder:text-muted-foreground/50"
              />
              <button onClick={addTag} className="h-8 rounded-lg bg-white/10 px-3 text-[11px] text-white hover:bg-white/15"><Tag className="h-3 w-3" /></button>
            </div>
          </F>

          {/* Feature flags */}
          <F label="Flags">
            <div className="flex flex-wrap gap-2">
              <Toggle value={form.visibility} onChange={() => set('visibility', !form.visibility)} label="Visible" />
              <Toggle value={form.is_featured} onChange={() => set('is_featured', !form.is_featured)} label="Featured" />
              <Toggle value={form.is_new} onChange={() => set('is_new', !form.is_new)} label="New" />
              <Toggle value={form.is_trending} onChange={() => set('is_trending', !form.is_trending)} label="Trending" />
            </div>
          </F>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-end gap-3 border-t border-border/50 px-6 py-4">
          <button onClick={onClose} className="rounded-lg px-4 py-2 text-[12px] text-muted-foreground hover:text-white transition-colors">
            Cancel
          </button>
          <button onClick={save} disabled={saving || !form.title || !form.price}
            className="flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-[12px] font-semibold text-black hover:bg-white/90 disabled:opacity-50 transition-colors">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {product ? 'Save Changes' : 'Create Product'}
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Products Page ─────────────────────────────────────────────────────────────
export default function ProductsPage() {
  const qc = useQueryClient();
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<'all' | 'visible' | 'archived'>('all');
  const [editing, setEditing] = useState<Product | null | 'new'>('null' as unknown as null);
  const [drawerOpen, setDrawerOpen] = useState(false);

  const { data: products = [], isLoading } = useQuery({
    queryKey: ['products', search, filter],
    queryFn: async () => {
      let q = supabase.from('products')
        .select('*, categories(title), brands(name)')
        .order('created_at', { ascending: false });
      if (search) q = q.ilike('title', `%${search}%`);
      if (filter === 'visible') q = q.eq('visibility', true);
      if (filter === 'archived') q = q.eq('visibility', false);
      const { data } = await q.limit(100);
      return (data as Product[]) ?? [];
    },
  });

  const { data: categories = [] } = useQuery({
    queryKey: ['categories'],
    queryFn: async () => { const { data } = await supabase.from('categories').select('*').order('title'); return data ?? []; },
  });
  const { data: brands = [] } = useQuery({
    queryKey: ['brands'],
    queryFn: async () => { const { data } = await supabase.from('brands').select('*').order('name'); return data ?? []; },
  });

  const toggleVisibility = useMutation({
    mutationFn: async ({ id, v }: { id: string; v: boolean }) => {
      const { data, error } = await supabase.from('products').update({ visibility: !v, updated_at: new Date().toISOString() }).eq('id', id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const duplicate = useMutation({
    mutationFn: async (p: Product) => {
      const { data } = await supabase.from('products')
        .insert({ ...p, id: undefined, slug: p.slug + '-copy', title: p.title + ' (Copy)', created_at: undefined, updated_at: undefined })
        .select('id').single();
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const deleteProduct = useMutation({
    mutationFn: async (id: string) => {
      const { data, error } = await supabase.from('products').delete().eq('id', id);
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['products'] }),
  });

  const openDrawer = (p: Product | null) => { setEditing(p); setDrawerOpen(true); };

  return (
    <div className="flex h-full flex-col">
      {/* Toolbar */}
      <div className="flex items-center gap-3 border-b border-border/50 px-6 py-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border/50 bg-card/40 px-3 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search products…"
            className="flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-muted-foreground" />
        </div>
        <div className="flex items-center gap-1 rounded-lg border border-border/50 bg-card/40 p-1">
          {(['all', 'visible', 'archived'] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={cn('rounded px-3 py-1.5 text-[11px] font-medium capitalize transition-colors',
                filter === f ? 'bg-white/10 text-white' : 'text-muted-foreground hover:text-white')}>
              {f}
            </button>
          ))}
        </div>
        <button onClick={() => openDrawer(null)}
          className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-[12px] font-semibold text-black hover:bg-white/90 transition-colors">
          <Plus className="h-3.5 w-3.5" /> New Product
        </button>
      </div>

      {/* Table header */}
      <div className="overflow-x-auto min-h-0 flex-1 flex flex-col">
        <div className="min-w-[800px] grid grid-cols-[56px_1fr_140px_100px_80px_80px_100px] items-center gap-4 border-b border-border/50 bg-muted/30 px-6 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground shrink-0">
          <span>Image</span><span>Product</span><span>Category</span>
          <span className="text-right">Price</span><span className="text-right">Stock</span>
          <span className="text-center">Status</span><span className="text-right">Actions</span>
        </div>

      {/* Rows */}
      <div className="flex-1 overflow-y-auto pb-4 shrink-0">
        <div className="min-w-[800px]">
        {isLoading ? (
          <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        ) : products.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
            <Package className="h-8 w-8 opacity-30" />
            <p className="text-[12px]">No products found</p>
            <button onClick={() => openDrawer(null)} className="mt-2 rounded-lg bg-white/10 px-4 py-2 text-[11px] text-white hover:bg-white/15">
              Create your first product
            </button>
          </div>
        ) : (
          products.map(p => (
            <div key={p.id}
              className="grid grid-cols-[56px_1fr_140px_100px_80px_80px_100px] items-center gap-4 border-b border-border/30 px-6 py-3 hover:bg-white/[0.02] transition-colors">
              {/* Image */}
              <div className="h-10 w-10 overflow-hidden rounded-lg bg-muted">
                {p.cloudinary_image_url
                  ? <img src={p.cloudinary_image_url} alt="" className="h-full w-full object-cover" /> /* eslint-disable-line @next/next/no-img-element */
                  : <Package className="h-full w-full p-2 text-muted-foreground/30" />}
              </div>
              {/* Title */}
              <div className="min-w-0">
                <p className="truncate text-[12px] font-medium text-white">{p.title}</p>
                <p className="truncate text-[10px] text-muted-foreground">{p.sku || p.slug}</p>
              </div>
              {/* Category */}
              <span className="truncate text-[11px] text-muted-foreground">
                {(p as unknown as {categories?: {title: string}}).categories?.title ?? '—'}
              </span>
              {/* Price */}
              <span className="text-right text-[12px] font-medium text-white">₹{p.price.toFixed(2)}</span>
              {/* Stock */}
              <span className={cn('text-right text-[12px] font-medium tabular-nums',
                p.stock === 0 ? 'text-red-400' : p.stock < 10 ? 'text-amber-400' : 'text-green-400')}>
                {p.stock}
              </span>
              {/* Status */}
              <div className="flex justify-center">
                <span className={cn('rounded-full px-2 py-0.5 text-[9px] font-bold uppercase',
                  p.visibility ? 'bg-green-500/10 text-green-400' : 'bg-muted text-muted-foreground')}>
                  {p.visibility ? 'Live' : 'Hidden'}
                </span>
              </div>
              {/* Actions */}
              <div className="flex items-center justify-end gap-1">
                <button onClick={() => openDrawer(p)} title="Edit"
                  className="rounded p-1.5 text-muted-foreground hover:bg-white/5 hover:text-white transition-colors">
                  <Pencil className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => toggleVisibility.mutate({ id: p.id, v: p.visibility })} title={p.visibility ? 'Hide' : 'Show'}
                  className="rounded p-1.5 text-muted-foreground hover:bg-white/5 hover:text-white transition-colors">
                  {p.visibility ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => duplicate.mutate(p)} title="Duplicate"
                  className="rounded p-1.5 text-muted-foreground hover:bg-white/5 hover:text-white transition-colors">
                  <Copy className="h-3.5 w-3.5" />
                </button>
                <button onClick={() => { if(confirm('Delete product?')) deleteProduct.mutate(p.id); }} title="Delete"
                  className="rounded p-1.5 text-muted-foreground hover:bg-red-500/10 hover:text-red-400 transition-colors">
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            </div>
          ))
        )}
        </div>
      </div>
      </div>

      {/* Drawer */}
      {drawerOpen && (
        <ProductDrawer
          product={editing === 'new' ? null : editing as Product | null}
          categories={categories as Category[]}
          brands={brands as Brand[]}
          onClose={() => setDrawerOpen(false)}
          onSaved={() => qc.invalidateQueries({ queryKey: ['products'] })}
        />
      )}
    </div>
  );
}
