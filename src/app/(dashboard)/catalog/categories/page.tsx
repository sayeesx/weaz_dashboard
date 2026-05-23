'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@/lib/supabase/client';
import { Plus, Search, Pencil, Trash2, X, Loader2, Check, Upload, ImageIcon, ChevronRight } from 'lucide-react';
import { cn } from '@/lib/utils';

const supabase = createClient();
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

interface Category    { id: string; slug: string; title: string; cloudinary_image_url: string | null; }
interface Subcategory { id: string; slug: string; title: string; category_id: string; cloudinary_image_url: string | null; }

async function uploadImg(file: File, folder = 'weaz/categories'): Promise<string> {
  const res = await fetch('/api/cloudinary/sign', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ upload_preset: 'weaz_admin_signed', folder }),
  });
  const { signature, timestamp, api_key, upload_preset } = await res.json();
  const fd = new FormData();
  fd.append('file', file); fd.append('api_key', api_key);
  fd.append('timestamp', String(timestamp)); fd.append('signature', signature);
  fd.append('upload_preset', upload_preset); fd.append('folder', folder);
  const up = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, { method: 'POST', body: fd });
  const data = await up.json();
  if (!data.secure_url) throw new Error(data.error?.message ?? 'Upload failed');
  return data.secure_url;
}

function ImagePick({ value, onChange }: { value: string; onChange: (url: string) => void }) {
  const [loading, setLoading] = useState(false);
  const ref = useRef<HTMLInputElement>(null);
  const handle = async (f?: File | null) => {
    if (!f) return;
    setLoading(true);
    try { onChange(await uploadImg(f)); } catch (e: unknown) { alert((e as Error).message); }
    setLoading(false);
  };
  return (
    <div onClick={() => ref.current?.click()}
      className="relative aspect-square w-full cursor-pointer overflow-hidden rounded-xl border border-dashed border-border/50 hover:border-white/20 transition-colors">
      <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => handle(e.target.files?.[0])} />
      {loading ? <div className="flex h-full items-center justify-center"><Loader2 className="h-5 w-5 animate-spin text-muted-foreground" /></div>
        : value ? <>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={value} alt="" className="h-full w-full object-cover" />
            <div className="absolute inset-0 flex items-center justify-center bg-black/50 opacity-0 hover:opacity-100 transition-opacity">
              <Upload className="h-5 w-5 text-white" />
            </div>
          </>
        : <div className="flex h-full flex-col items-center justify-center gap-1">
            <ImageIcon className="h-5 w-5 text-muted-foreground/40" />
            <p className="text-[9px] text-muted-foreground">Tap to upload</p>
          </div>}
    </div>
  );
}

function CatModal({ category, onClose, onSaved }: { category: Category | null; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(category?.title ?? '');
  const [slug,  setSlug]  = useState(category?.slug  ?? '');
  const [img,   setImg]   = useState(category?.cloudinary_image_url ?? '');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!title) return; setSaving(true);
    const payload = { title, slug: slug || title.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''), cloudinary_image_url: img || null, updated_at: new Date().toISOString() };
    if (category) await supabase.from('categories').update(payload).eq('id', category.id);
    else await supabase.from('categories').insert(payload);
    setSaving(false); onSaved(); onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full sm:h-auto sm:max-h-[90vh] sm:max-w-[380px] flex-col sm:rounded-2xl border-0 sm:border border-border/50 bg-card p-6 shadow-2xl">
        <div className="mb-5 flex items-center justify-between">
          <h3 className="text-[14px] font-bold text-white">{category ? 'Edit Category' : 'New Category'}</h3>
          <button onClick={onClose} className="rounded-lg p-1.5 text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>
        </div>
        <div className="mx-auto mb-4 w-32"><ImagePick value={img} onChange={setImg} /></div>
        <div className="space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Category name *"
            className="h-9 w-full rounded-lg border border-border/50 bg-muted/30 px-3 text-[12px] text-white outline-none focus:border-white/30" />
          <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="slug (auto)"
            className="h-9 w-full rounded-lg border border-border/50 bg-muted/30 px-3 text-[12px] text-white outline-none focus:border-white/30" />
        </div>
        <div className="mt-5 flex justify-end gap-3">
          <button onClick={onClose} className="px-4 py-2 text-[12px] text-muted-foreground hover:text-white">Cancel</button>
          <button onClick={save} disabled={saving || !title}
            className="flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-[12px] font-semibold text-black disabled:opacity-50">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

function SubModal({ sub, categoryId, onClose, onSaved }: { sub: Subcategory | null; categoryId: string; onClose: () => void; onSaved: () => void }) {
  const [title, setTitle] = useState(sub?.title ?? '');
  const [slug,  setSlug]  = useState(sub?.slug  ?? '');
  const [saving, setSaving] = useState(false);
  const save = async () => {
    if (!title) return; setSaving(true);
    const payload = { category_id: categoryId, title, slug: slug || title.toLowerCase().replace(/\s+/g,'-').replace(/[^a-z0-9-]/g,''), updated_at: new Date().toISOString() };
    if (sub) await supabase.from('subcategories').update(payload).eq('id', sub.id);
    else await supabase.from('subcategories').insert(payload);
    setSaving(false); onSaved(); onClose();
  };
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative z-10 flex h-full w-full sm:h-auto sm:max-h-[90vh] sm:max-w-[340px] flex-col sm:rounded-2xl border-0 sm:border border-border/50 bg-card p-5 shadow-2xl">
        <div className="mb-4 flex items-center justify-between">
          <h3 className="text-[13px] font-bold text-white">{sub ? 'Edit Subcategory' : 'New Subcategory'}</h3>
          <button onClick={onClose} className="rounded p-1 text-muted-foreground hover:text-white"><X className="h-3.5 w-3.5" /></button>
        </div>
        <div className="space-y-3">
          <input value={title} onChange={e => setTitle(e.target.value)} placeholder="Name *"
            className="h-9 w-full rounded-lg border border-border/50 bg-muted/30 px-3 text-[12px] text-white outline-none" />
          <input value={slug} onChange={e => setSlug(e.target.value)} placeholder="Slug (optional)"
            className="h-9 w-full rounded-lg border border-border/50 bg-muted/30 px-3 text-[12px] text-white outline-none" />
        </div>
        <div className="mt-4 flex justify-end gap-3">
          <button onClick={onClose} className="text-[11px] text-muted-foreground hover:text-white">Cancel</button>
          <button onClick={save} disabled={saving || !title}
            className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-1.5 text-[11px] font-semibold text-black disabled:opacity-50">
            {saving ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />} Save
          </button>
        </div>
      </div>
    </div>
  );
}

export default function CategoriesPage() {
  const qc = useQueryClient();
  const [search, setSearch]   = useState('');
  const [expanded, setExpanded] = useState<string | null>(null);
  const [catModal, setCatModal] = useState<{ open: boolean; cat: Category | null }>({ open: false, cat: null });
  const [subModal, setSubModal] = useState<{ sub: Subcategory | null; catId: string } | null>(null);

  const { data: categories = [], isLoading } = useQuery({
    queryKey: ['categories', search],
    queryFn: async () => {
      let q = supabase.from('categories').select('*').order('title');
      if (search) q = q.ilike('title', `%${search}%`);
      const { data } = await q; return (data as Category[]) ?? [];
    },
  });
  const { data: subcategories = [] } = useQuery({
    queryKey: ['subcategories'],
    queryFn: async () => { const { data } = await supabase.from('subcategories').select('*').order('title'); return (data as Subcategory[]) ?? []; },
  });
  const delCat = useMutation({ mutationFn: async (id: string) => { const { data, error } = await supabase.from('categories').delete().eq('id', id); if (error) throw error; return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['categories'] }) });
  const delSub = useMutation({ mutationFn: async (id: string) => { const { data, error } = await supabase.from('subcategories').delete().eq('id', id); if (error) throw error; return data; }, onSuccess: () => qc.invalidateQueries({ queryKey: ['subcategories'] }) });

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center gap-3 border-b border-border/50 px-6 py-3">
        <div className="flex flex-1 items-center gap-2 rounded-lg border border-border/50 bg-card/40 px-3 py-2">
          <Search className="h-3.5 w-3.5 text-muted-foreground" />
          <input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search categories…"
            className="flex-1 bg-transparent text-[12px] text-white outline-none placeholder:text-muted-foreground" />
        </div>
        <button onClick={() => setCatModal({ open: true, cat: null })}
          className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-[12px] font-semibold text-black hover:bg-white/90">
          <Plus className="h-3.5 w-3.5" /> New Category
        </button>
      </div>
      <div className="flex-1 overflow-y-auto divide-y divide-border/30">
        {isLoading ? <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
          : categories.map(cat => {
            const subs = subcategories.filter(s => s.category_id === cat.id);
            const open = expanded === cat.id;
            return (
              <div key={cat.id}>
                <div className="flex items-center gap-4 px-6 py-3 hover:bg-white/[0.02]">
                  <button onClick={() => setExpanded(open ? null : cat.id)} className="text-muted-foreground hover:text-white">
                    <ChevronRight className={cn('h-4 w-4 transition-transform', open && 'rotate-90')} />
                  </button>
                  <div className="h-10 w-10 overflow-hidden rounded-lg bg-muted shrink-0">
                    {cat.cloudinary_image_url ? <img src={cat.cloudinary_image_url} alt="" className="h-full w-full object-cover" /> /* eslint-disable-line @next/next/no-img-element */
                      : <div className="h-full w-full" />}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-[13px] font-medium text-white">{cat.title}</p>
                    <p className="text-[10px] text-muted-foreground">{subs.length} sub · {cat.slug}</p>
                  </div>
                  <button onClick={() => setCatModal({ open: true, cat })} className="rounded p-1.5 text-muted-foreground hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                  <button onClick={() => { if(confirm('Delete category and all its subcategories?')) delCat.mutate(cat.id); }} className="rounded p-1.5 text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
                </div>
                {open && (
                  <div className="bg-muted/10 px-6 py-2 space-y-1 border-t border-border/20">
                    {subs.map(s => (
                      <div key={s.id} className="flex items-center gap-3 rounded-lg px-3 py-2 hover:bg-white/[0.03]">
                        <div className="ml-4 h-7 w-7 overflow-hidden rounded bg-muted shrink-0">
                          {s.cloudinary_image_url ? <img src={s.cloudinary_image_url} alt="" className="h-full w-full object-cover" /> /* eslint-disable-line @next/next/no-img-element */
                            : <div className="h-full w-full bg-muted/50" />}
                        </div>
                        <p className="flex-1 text-[12px] text-muted-foreground">{s.title}</p>
                        <button onClick={() => setSubModal({ sub: s, catId: cat.id })} className="rounded p-1 text-muted-foreground/50 hover:text-white"><Pencil className="h-3 w-3" /></button>
                        <button onClick={() => { if(confirm('Delete?')) delSub.mutate(s.id); }} className="rounded p-1 text-muted-foreground/50 hover:text-red-400"><Trash2 className="h-3 w-3" /></button>
                      </div>
                    ))}
                    <button onClick={() => setSubModal({ sub: null, catId: cat.id })}
                      className="ml-4 flex items-center gap-1.5 rounded-lg px-3 py-2 text-[11px] text-muted-foreground hover:text-white">
                      <Plus className="h-3 w-3" /> Add Subcategory
                    </button>
                  </div>
                )}
              </div>
            );
          })}
      </div>
      {catModal.open && <CatModal category={catModal.cat} onClose={() => setCatModal({ open: false, cat: null })} onSaved={() => qc.invalidateQueries({ queryKey: ['categories'] })} />}
      {subModal && <SubModal sub={subModal.sub} categoryId={subModal.catId} onClose={() => setSubModal(null)} onSaved={() => qc.invalidateQueries({ queryKey: ['subcategories'] })} />}
    </div>
  );
}
