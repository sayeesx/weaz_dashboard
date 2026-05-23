'use client';

import { useState, useRef } from 'react';
import { Upload, Image as ImageIcon, Loader2, Trash2, ExternalLink, Copy, Check } from 'lucide-react';

const CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;

interface CldAsset {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  bytes: number;
}

async function signUpload(preset: string, folder?: string) {
  const res = await fetch('/api/cloudinary/sign', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ upload_preset: preset, folder }),
  });
  return res.json();
}

async function uploadFile(file: File, folder = 'weaz/media'): Promise<CldAsset> {
  const { signature, timestamp, api_key, upload_preset } = await signUpload('weaz_admin_signed', folder);
  const fd = new FormData();
  fd.append('file', file);
  fd.append('api_key', api_key);
  fd.append('timestamp', String(timestamp));
  fd.append('signature', signature);
  fd.append('upload_preset', upload_preset);
  fd.append('folder', folder);
  const res = await fetch(`https://api.cloudinary.com/v1_1/${CLOUD_NAME}/upload`, { method: 'POST', body: fd });
  if (!res.ok) throw new Error('Upload failed');
  return res.json();
}

export default function MediaPage() {
  const [uploads, setUploads] = useState<CldAsset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [copied, setCopied] = useState('');
  const [dragOver, setDragOver] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleFiles = async (files: FileList | null) => {
    if (!files?.length) return;
    setLoading(true); setError('');
    try {
      const results = await Promise.all(Array.from(files).map((f) => uploadFile(f)));
      setUploads((prev) => [...results, ...prev]);
    } catch { setError('One or more uploads failed. Check Cloudinary preset.'); }
    setLoading(false);
  };

  const copyUrl = (url: string) => {
    navigator.clipboard.writeText(url);
    setCopied(url);
    setTimeout(() => setCopied(''), 2000);
  };

  return (
    <div className="flex h-full flex-col gap-0">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border/50 px-6 py-4">
        <div>
          <h1 className="text-[15px] font-bold text-white">Media Library</h1>
          <p className="mt-0.5 text-[11px] text-muted-foreground">Upload and manage assets via Cloudinary</p>
        </div>
        <button
          onClick={() => inputRef.current?.click()}
          className="flex items-center gap-2 rounded-lg bg-white/10 px-4 py-2 text-[12px] font-medium text-white hover:bg-white/15 transition-colors"
        >
          <Upload className="h-3.5 w-3.5" /> Upload Files
        </button>
        <input ref={inputRef} type="file" multiple accept="image/*,video/*,.json,.svg" className="hidden"
          onChange={(e) => handleFiles(e.target.files)} />
      </div>

      {/* Drop zone */}
      <div
        onDrop={(e) => { e.preventDefault(); setDragOver(false); handleFiles(e.dataTransfer.files); }}
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        className={`mx-6 mt-5 flex flex-col items-center justify-center rounded-xl border-2 border-dashed p-10 transition-colors cursor-pointer
          ${dragOver ? 'border-white/40 bg-white/5' : 'border-border/40 hover:border-white/20'}`}
        onClick={() => inputRef.current?.click()}
      >
        {loading ? (
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        ) : (
          <>
            <Upload className="h-8 w-8 text-muted-foreground" />
            <p className="mt-3 text-[13px] font-medium text-white">Drag & drop files here</p>
            <p className="mt-1 text-[11px] text-muted-foreground">Images, videos, SVG, Lottie (.json) — max 25 MB each</p>
          </>
        )}
        {error && <p className="mt-3 text-[11px] text-red-400">{error}</p>}
      </div>

      {/* Grid */}
      {uploads.length > 0 && (
        <div className="flex-1 overflow-auto px-6 pb-6 pt-5">
          <p className="mb-3 text-[11px] text-muted-foreground">{uploads.length} asset{uploads.length !== 1 ? 's' : ''} uploaded this session</p>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6">
            {uploads.map((asset) => (
              <div key={asset.public_id} className="group relative overflow-hidden rounded-lg border border-border/50 bg-card">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={asset.secure_url} alt={asset.public_id} className="aspect-square w-full object-cover" />
                {/* Overlay */}
                <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-black/60 opacity-0 transition-opacity group-hover:opacity-100">
                  <button onClick={() => copyUrl(asset.secure_url)}
                    className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-[10px] text-white hover:bg-white/20">
                    {copied === asset.secure_url ? <Check className="h-3 w-3" /> : <Copy className="h-3 w-3" />}
                    {copied === asset.secure_url ? 'Copied' : 'Copy URL'}
                  </button>
                  <a href={asset.secure_url} target="_blank" rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded bg-white/10 px-2 py-1 text-[10px] text-white hover:bg-white/20">
                    <ExternalLink className="h-3 w-3" /> Open
                  </a>
                </div>
                {/* Info */}
                <div className="border-t border-border/50 px-2 py-1.5">
                  <p className="truncate text-[9px] text-muted-foreground">{asset.public_id.split('/').pop()}</p>
                  <p className="text-[9px] text-muted-foreground/60">{(asset.bytes / 1024).toFixed(0)} KB · {asset.format?.toUpperCase()}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {uploads.length === 0 && !loading && (
        <div className="flex flex-1 flex-col items-center justify-center gap-2 text-muted-foreground">
          <ImageIcon className="h-10 w-10 opacity-20" />
          <p className="text-[12px]">Uploaded assets appear here</p>
        </div>
      )}
    </div>
  );
}
