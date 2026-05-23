'use client';

import { useState, useRef } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { createClient } from '@supabase/supabase-js';
import { Plus, Pencil, Trash2, Eye, EyeOff, X, Loader2, Check, Upload, ImageIcon, GripVertical } from 'lucide-react';
import { cn } from '@/lib/utils';

const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

interface Banner {
  id: string; title: string; subtitle_en: string | null; tone: string;
  image_url: string | null; cta_label_en: string | null; target_url: string | null;
  sort_order: number; is_active: boolean;
}

async function uploadBannerImg(file: File): Promise<string> {
  const res = await fetch('/api/cloudinary/sign', {
    method: 'POST', headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ upload_preset: 'weaz_admin_signed', folder: 'weaz/banners' }),
  });
  const { signature, timestamp, api_key, upload_preset } = await res.json();
  const fd = new FormData();
  fd.append('file', file); fd.append('api_key', api_key);
  fd.append('timestamp', String(timestamp)); fd.append('signature', signature);
  fd.append('upload_preset', upload_preset); fd.append('folder', 'weaz/banners');
  const up = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, { method: 'POST', body: fd });
  const data = await up.json();
  if (!data.secure_url) throw new Error(data.error?.message ?? 'Upload failed');
  return data.secure_url;
}

const TONES = [
  { value: 'green',  label: 'Green',  cls: 'bg-green-600 text-white' },
  { value: 'yellow', label: 'Yellow', cls: 'bg-yellow-400 text-black' },
  { value: 'dark',   label: 'Dark',   cls: 'bg-zinc-900 text-white border border-white/10' },
];

function BannerModal({ banner, onClose, onSaved }: { banner: Banner | null; onClose: () => void; onSaved: () => void }) {
  const [title,    setTitle]   = useState(banner?.title ?? '');
  const [sub,      setSub]     = useState(banner?.subtitle_en ?? '');
  const [tone,     setTone]    = useState(banner?.tone ?? 'green');
  const [img,      setImg]     = useState(banner?.image_url ?? '');
  const [cta,      setCta]     = useState(banner?.cta_label_en ?? 'Shop Now');
  const [url,      setUrl]     = useState(banner?.target_url ?? '');
  const [saving,   setSaving]  = useState(false);
  const [imgLoad,  setImgLoad] = useState(false);
  const ref = useRef<HTMLInputElement>(null);

  const handleImg = async (f?: File | null) => {
    if (!f) return; setImgLoad(true);
    try { setImg(await uploadBannerImg(f)); } catch (e: unknown) { alert((e as Error).message); }
    setImgLoad(false);
  };

  const save = async () => {
    if (!title) return; setSaving(true);
    const payload = { title, subtitle_en: sub || null, tone, image_url: img || null, cta_label_en: cta || null, target_url: url || null, updated_at: new Date().toISOString() };
    if (banner) await supabase.from('banners').update(payload).eq('id', banner.id);
    else await supabase.from('banners').insert({ ...payload, sort_order: 0, is_active: true });
    setSaving(false); onSaved(); onClose();
  };

  const toneStyle = TONES.find(t => t.value === tone);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-2 sm:p-4">
      <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={onClose} />
      <div className="relative flex max-h-full w-full max-w-[600px] flex-col rounded-xl border border-border/50 bg-background shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
          <h3 className="text-[14px] font-bold text-white">{banner ? 'Edit Banner' : 'New Banner'}</h3>
          <button onClick={onClose} className="rounded p-1.5 text-muted-foreground hover:text-white"><X className="h-4 w-4" /></button>
        </div>

        {/* Live preview */}
        <div className={cn('mx-6 mt-5 flex h-[110px] items-center justify-between overflow-hidden rounded-2xl px-5', toneStyle?.cls ?? '')}>
          <div className="space-y-1">
            <p className="text-[9px] font-black uppercase tracking-widest opacity-80">{sub || 'Subtitle here'}</p>
            <p className="text-[18px] font-black leading-none tracking-tighter">{title || 'Banner Title'}</p>
            <div className={cn('mt-2 w-fit rounded-full px-3 py-1 text-[9px] font-black uppercase', tone === 'yellow' ? 'bg-black text-white' : 'bg-white text-black')}>
              {cta || 'Shop Now'}
            </div>
          </div>
          {img && <img src={img} alt="" className="h-20 w-20 object-contain opacity-20" />} {/* eslint-disable-line @next/next/no-img-element */}
        </div>

        <div className="flex-1 space-y-4 overflow-y-auto px-6 py-5">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">Title *</label>
              <input value={title} onChange={e => setTitle(e.target.value)} placeholder="FLAT 20% OFF"
                className="h-9 w-full rounded-lg border border-border/50 bg-muted/30 px-3 text-[12px] text-white outline-none focus:border-white/30" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">Subtitle</label>
              <input value={sub} onChange={e => setSub(e.target.value)} placeholder="Limited time offer"
                className="h-9 w-full rounded-lg border border-border/50 bg-muted/30 px-3 text-[12px] text-white outline-none focus:border-white/30" />
            </div>
          </div>

          {/* Tone */}
          <div>
            <label className="mb-2 block text-[11px] font-medium text-muted-foreground">Tone</label>
            <div className="flex gap-2">
              {TONES.map(t => (
                <button key={t.value} onClick={() => setTone(t.value)}
                  className={cn('flex-1 rounded-lg py-2 text-[11px] font-semibold transition-all', t.cls, tone === t.value ? 'ring-2 ring-white/50 ring-offset-1 ring-offset-card' : 'opacity-60')}>
                  {t.label}
                </button>
              ))}
            </div>
          </div>

          {/* Image */}
          <div>
            <label className="mb-2 block text-[11px] font-medium text-muted-foreground">Banner Image</label>
            <div className="flex gap-3 items-start">
              <div onClick={() => ref.current?.click()}
                className="relative h-20 w-20 shrink-0 cursor-pointer overflow-hidden rounded-xl border border-dashed border-border/50 hover:border-white/20 transition-colors">
                <input ref={ref} type="file" accept="image/*" className="hidden" onChange={e => handleImg(e.target.files?.[0])} />
                {imgLoad ? <div className="flex h-full items-center justify-center"><Loader2 className="h-4 w-4 animate-spin text-muted-foreground" /></div>
                  : img ? <img src={img} alt="" className="h-full w-full object-cover" /> /* eslint-disable-line @next/next/no-img-element */
                  : <div className="flex h-full items-center justify-center"><ImageIcon className="h-5 w-5 text-muted-foreground/40" /></div>}
              </div>
              <div className="flex-1 space-y-2">
                <input value={img} onChange={e => setImg(e.target.value)} placeholder="Or paste Cloudinary URL"
                  className="h-9 w-full rounded-lg border border-border/50 bg-muted/30 px-3 text-[11px] text-white outline-none" />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">CTA Label</label>
              <input value={cta} onChange={e => setCta(e.target.value)} placeholder="Shop Now"
                className="h-9 w-full rounded-lg border border-border/50 bg-muted/30 px-3 text-[12px] text-white outline-none" />
            </div>
            <div>
              <label className="mb-1.5 block text-[11px] font-medium text-muted-foreground">Target URL</label>
              <input value={url} onChange={e => setUrl(e.target.value)} placeholder="/categories?selected=offers"
                className="h-9 w-full rounded-lg border border-border/50 bg-muted/30 px-3 text-[12px] text-white outline-none" />
            </div>
          </div>
        </div>

        <div className="flex justify-end gap-3 border-t border-border/50 px-6 py-4">
          <button onClick={onClose} className="px-4 py-2 text-[12px] text-muted-foreground hover:text-white">Cancel</button>
          <button onClick={save} disabled={saving || !title}
            className="flex items-center gap-2 rounded-lg bg-white px-5 py-2 text-[12px] font-semibold text-black disabled:opacity-50">
            {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
            {banner ? 'Save Changes' : 'Create Banner'}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function BannersPage() {
  const qc = useQueryClient();
  const [modal, setModal] = useState<{ open: boolean; banner: Banner | null }>({ open: false, banner: null });

  const { data: banners = [], isLoading } = useQuery({
    queryKey: ['banners'],
    queryFn: async () => { const { data } = await supabase.from('banners').select('*').order('sort_order'); return (data as Banner[]) ?? []; },
  });

  const toggle = useMutation({
    mutationFn: async ({ id, v }: { id: string; v: boolean }) => { const { data, error } = await supabase.from('banners').update({ is_active: !v, updated_at: new Date().toISOString() }).eq('id', id); if (error) throw error; return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banners'] }),
  });
  const del = useMutation({
    mutationFn: async (id: string) => { const { data, error } = await supabase.from('banners').delete().eq('id', id); if (error) throw error; return data; },
    onSuccess: () => qc.invalidateQueries({ queryKey: ['banners'] }),
  });

  const tonePreviewCls = (tone: string) =>
    tone === 'green' ? 'bg-green-600' : tone === 'yellow' ? 'bg-yellow-400' : 'bg-zinc-900 border border-white/10';

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-3">
        <div>
          <h2 className="text-[14px] font-bold text-white">Promo Banners</h2>
          <p className="text-[11px] text-muted-foreground mt-0.5">{banners.length} banner{banners.length !== 1 ? 's' : ''}</p>
        </div>
        <button onClick={() => setModal({ open: true, banner: null })}
          className="flex items-center gap-1.5 rounded-lg bg-white px-4 py-2 text-[12px] font-semibold text-black hover:bg-white/90">
          <Plus className="h-3.5 w-3.5" /> New Banner
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-6 space-y-3">
        {isLoading ? <div className="flex items-center justify-center py-20"><Loader2 className="h-6 w-6 animate-spin text-muted-foreground" /></div>
        : banners.length === 0
          ? <div className="flex flex-col items-center justify-center gap-2 py-20 text-muted-foreground">
              <ImageIcon className="h-8 w-8 opacity-30" />
              <p className="text-[12px]">No banners yet</p>
              <button onClick={() => setModal({ open: true, banner: null })} className="mt-2 rounded-lg bg-white/10 px-4 py-2 text-[11px] text-white hover:bg-white/15">Create first banner</button>
            </div>
          : banners.map(b => (
            <div key={b.id} className={cn('flex items-center gap-4 overflow-hidden rounded-2xl transition-opacity', !b.is_active && 'opacity-50')}>
              {/* Preview chip */}
              <div className={cn('flex h-[80px] w-[200px] shrink-0 items-center justify-center overflow-hidden rounded-xl px-4', tonePreviewCls(b.tone))}>
                <div className="min-w-0">
                  <p className="text-[8px] font-black uppercase opacity-70 truncate">{b.subtitle_en}</p>
                  <p className="text-[13px] font-black leading-tight truncate" style={{ color: b.tone === 'yellow' ? '#000' : '#fff' }}>{b.title}</p>
                </div>
              </div>
              {/* Details */}
              <div className="min-w-0 flex-1">
                <p className="text-[13px] font-medium text-white">{b.title}</p>
                <p className="text-[10px] text-muted-foreground">{b.tone} · sort: {b.sort_order} · {b.target_url || 'No link'}</p>
              </div>
              {/* Status */}
              <span className={cn('shrink-0 rounded-full px-2 py-0.5 text-[9px] font-bold uppercase', b.is_active ? 'bg-green-500/10 text-green-400' : 'bg-muted text-muted-foreground')}>
                {b.is_active ? 'Active' : 'Hidden'}
              </span>
              {/* Actions */}
              <div className="flex shrink-0 items-center gap-1">
                <button onClick={() => setModal({ open: true, banner: b })} className="rounded p-1.5 text-muted-foreground hover:text-white"><Pencil className="h-3.5 w-3.5" /></button>
                <button onClick={() => toggle.mutate({ id: b.id, v: b.is_active })} className="rounded p-1.5 text-muted-foreground hover:text-white">
                  {b.is_active ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
                </button>
                <button onClick={() => { if(confirm('Delete banner?')) del.mutate(b.id); }} className="rounded p-1.5 text-muted-foreground hover:text-red-400"><Trash2 className="h-3.5 w-3.5" /></button>
              </div>
            </div>
          ))}
      </div>

      {modal.open && (
        <BannerModal banner={modal.banner} onClose={() => setModal({ open: false, banner: null })} onSaved={() => qc.invalidateQueries({ queryKey: ['banners'] })} />
      )}
    </div>
  );
}
