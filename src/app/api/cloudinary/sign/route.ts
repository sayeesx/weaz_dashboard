import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

// POST /api/cloudinary/sign
// Body: { public_id?, folder?, upload_preset? }
// Returns: { signature, timestamp, api_key, cloud_name }
// NEVER exposes CLOUDINARY_API_SECRET to the client.

const CLOUDINARY_API_KEY    = process.env.CLOUDINARY_API_KEY!;
const CLOUDINARY_API_SECRET = process.env.CLOUDINARY_API_SECRET!;
const CLOUDINARY_CLOUD_NAME = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME!;

const ALLOWED_PRESETS = new Set(['weaz_products', 'weaz_admin_signed']);

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => ({}));
    const { folder, upload_preset, public_id } = body as {
      folder?: string;
      upload_preset?: string;
      public_id?: string;
    };

    if (upload_preset && !ALLOWED_PRESETS.has(upload_preset)) {
      return NextResponse.json({ error: 'Invalid upload preset' }, { status: 400 });
    }

    const timestamp = Math.round(Date.now() / 1000);

    // Build params object — only include defined values
    const params: Record<string, string | number> = { timestamp };
    if (folder)    params.folder    = folder;
    if (public_id) params.public_id = public_id;
    if (upload_preset) params.upload_preset = upload_preset;

    // Canonical string: sorted alphabetically, key=value&... + secret
    const paramStr = Object.keys(params)
      .sort()
      .map((k) => `${k}=${params[k]}`)
      .join('&');

    const signature = crypto
      .createHash('sha256')
      .update(paramStr + CLOUDINARY_API_SECRET)
      .digest('hex');

    return NextResponse.json({
      signature,
      timestamp,
      api_key:    CLOUDINARY_API_KEY,
      cloud_name: CLOUDINARY_CLOUD_NAME,
      upload_preset,
      folder,
    });
  } catch (err) {
    console.error('[cloudinary-sign]', err);
    return NextResponse.json({ error: 'Signing failed' }, { status: 500 });
  }
}
