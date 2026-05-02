import { NextRequest, NextResponse } from 'next/server';
import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { SearchResult, SearchResultType } from '@/lib/search';
import { getPublicProfilePath } from '@/lib/profile';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function getAdminApp() {
  if (getApps().length > 0) return getApps()[0];

  const projectId = process.env.FIREBASE_PROJECT_ID;
  const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
  const privateKey = process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n');

  if (!projectId || !clientEmail || !privateKey) {
    throw new Error('Missing Firebase Admin credentials in environment variables.');
  }

  return initializeApp({
    credential: cert({ projectId, clientEmail, privateKey }),
  });
}

function normalizeAccountType(value: unknown): 'talent' | 'business' | 'agency' | null {
  if (value === 'user') return 'talent';
  if (['talent', 'business', 'agency'].includes(String(value))) {
    return value as 'talent' | 'business' | 'agency';
  }
  return null;
}

function titleForProfile(data: FirebaseFirestore.DocumentData): string {
  const fields = data.fields ?? {};
  if (data.accountType === 'business') return fields.businessProfile?.companyName || fields.displayName || 'Unnamed Business';
  if (data.accountType === 'agency') return fields.agencyProfile?.agencyName || fields.displayName || 'Unnamed Agency';
  return fields.displayName || 'Unnamed Talent';
}

export async function GET(req: NextRequest) {
  try {
    const { searchParams } = new URL(req.url);
    const queryParam = searchParams.get('q')?.toLowerCase() || '';
    const rawTypeParam = searchParams.get('type') || 'all';
    const typeParam = (rawTypeParam === 'user' ? 'talent' : rawTypeParam) as SearchResultType;

    if (!queryParam || queryParam.length < 2) {
      return NextResponse.json([]);
    }

    const app = getAdminApp();
    const db = getFirestore(app);
    const results: SearchResult[] = [];

    if (typeParam === 'all' || typeParam === 'talent' || typeParam === 'agency' || typeParam === 'business') {
      const profilesSnap = await db.collection('publicProfiles')
        .where('status', '==', 'published')
        .where('searchable', '==', true)
        .get();

      profilesSnap.forEach((doc) => {
        const data = doc.data();
        const accountType = normalizeAccountType(data.accountType);
        if (!accountType || data.moderationStatus === 'suspended') return;
        if (typeParam !== 'all' && typeParam !== accountType) return;

        const fields = data.fields ?? {};
        const title = titleForProfile(data);
        const subtitle = fields.headline || fields.location || fields.businessProfile?.industry || fields.agencyProfile?.description || accountType;
        const searchableText = [
          title,
          subtitle,
          fields.bio,
          fields.businessProfile?.description,
          fields.agencyProfile?.description,
          ...(fields.talentProfile?.skills ?? []),
          ...(fields.agencyProfile?.services ?? []),
          ...(fields.agencyProfile?.specialties ?? []),
          ...(fields.businessProfile?.culture?.tags ?? []),
        ].join(' ').toLowerCase();

        if (!searchableText.includes(queryParam)) return;

        results.push({
          id: doc.id,
          type: accountType,
          title,
          subtitle,
          image: fields.photoURL || null,
          url: getPublicProfilePath(accountType, data.slug || doc.id),
        });
      });
    }

    if (typeParam === 'all' || typeParam === 'job') {
      const jobsSnap = await db.collection('jobs').where('status', '==', 'active').get();
      jobsSnap.forEach((doc) => {
        const data = doc.data();
        if (data.visibility === 'private') return;

        const matchesTitle = (data.title || '').toLowerCase().includes(queryParam);
        const matchesCompany = (data.companyName || '').toLowerCase().includes(queryParam);
        const matchesDesc = (data.description || '').toLowerCase().includes(queryParam);

        if (matchesTitle || matchesCompany || matchesDesc) {
          results.push({
            id: doc.id,
            type: 'job',
            title: data.title || 'Untitled Job',
            subtitle: `${data.companyName || 'Unknown Company'} - ${data.location?.city || data.location || ''}`,
            image: data.companyLogo || null,
            url: data.slug ? `/jobs/${data.slug}` : `/jobs/${doc.id}`,
          });
        }
      });
    }

    return NextResponse.json(results.slice(0, 20));
  } catch (err) {
    console.error('[search/api]', err);
    return NextResponse.json({ error: err instanceof Error ? err.message : String(err) }, { status: 500 });
  }
}
