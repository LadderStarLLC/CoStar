export const runtime = 'nodejs';

import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];
  return initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_PROJECT_ID,
      clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export async function POST(req: NextRequest) {
  try {
    // Verify Firebase ID token from Authorization header
    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
    const idToken = authHeader.slice(7);

    const app = getAdminApp();
    await getAuth(app).verifyIdToken(idToken);

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json(
        { error: 'No Gemini API key configured for LadderStar.' },
        { status: 500 },
      );
    }

    const liveApiHost = 'generativelanguage.googleapis.com';
    const validation = await validateGeminiKey(apiKey);
    if (!validation.ok) {
      return NextResponse.json(
        { error: validation.error },
        { status: 502 },
      );
    }

    return NextResponse.json({ key: apiKey, host: liveApiHost });
  } catch (err) {
    console.error('[audition/token]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}

async function validateGeminiKey(apiKey: string): Promise<{ ok: true } | { ok: false; error: string }> {
  if (apiKey === 'your_gemini_api_key_here') {
    return { ok: false, error: 'Vercel GEMINI_API_KEY is still set to the placeholder value.' };
  }

  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(apiKey)}`,
      { method: 'GET', cache: 'no-store' },
    );
    if (res.ok) return { ok: true };

    const text = await res.text().catch(() => '');
    if (/API key not valid/i.test(text)) {
      return { ok: false, error: 'Vercel GEMINI_API_KEY is not a valid Gemini API key.' };
    }
    if (/API.*not.*enabled|has not been used|disabled|PERMISSION_DENIED|blocked/i.test(text)) {
      return { ok: false, error: 'Vercel GEMINI_API_KEY cannot access the Generative Language API. Enable the API and check key restrictions in Google Cloud/AI Studio.' };
    }
    return { ok: false, error: `Gemini key validation failed with ${res.status}. Check GEMINI_API_KEY restrictions and API access.` };
  } catch (err) {
    return { ok: false, error: `Gemini key validation failed: ${err instanceof Error ? err.message : String(err)}` };
  }
}
