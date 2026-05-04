export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import type { Query } from 'firebase-admin/firestore';
import { getCallerProfile, jsonError } from '@/lib/firebaseAdmin';

export async function GET(req: NextRequest) {
  try {
    const { decoded, profile, db } = await getCallerProfile(req);
    if (profile?.accountType !== 'business') {
      return NextResponse.json({ error: 'Only Business accounts can view screening reports.' }, { status: 403 });
    }
    const jobId = req.nextUrl.searchParams.get('jobId');
    let query: Query = db.collection('businessScreeningReports')
      .where('businessUid', '==', decoded.uid);
    if (jobId) query = query.where('jobId', '==', jobId);
    const snap = await query.orderBy('createdAt', 'desc').limit(20).get();
    const reports = snap.docs.map((doc) => {
      const data = doc.data();
      return {
        id: doc.id,
        ...data,
        createdAt: data.createdAt?.toDate?.()?.toISOString?.() ?? null,
      };
    });
    return NextResponse.json({ reports });
  } catch (err) {
    return jsonError(err);
  }
}
