export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { FieldValue } from 'firebase-admin/firestore';
import { writeAdminAuditLog } from '@/lib/adminAudit';
import { jsonError, requireOwner } from '@/lib/firebaseAdmin';

export async function POST(req: NextRequest) {
  try {
    const { decoded, profile, db } = await requireOwner(req);
    const snap = await db.collection('users').where('accountType', '==', 'user').get();

    if (snap.empty) {
      return NextResponse.json({ ok: true, migrated: 0 });
    }

    let migrated = 0;
    let batch = db.batch();
    let batchSize = 0;

    for (const doc of snap.docs) {
      const data = doc.data();
      batch.update(doc.ref, {
        accountType: 'talent',
        role: data.role === 'user' || !data.role ? 'talent' : data.role,
        accountTypeSource: data.accountTypeSource ?? 'migration',
        updatedAt: FieldValue.serverTimestamp(),
      });
      migrated += 1;
      batchSize += 1;

      if (batchSize === 450) {
        await batch.commit();
        batch = db.batch();
        batchSize = 0;
      }
    }

    if (batchSize > 0) {
      await batch.commit();
    }

    await writeAdminAuditLog({
      db,
      actor: decoded,
      actorRole: profile?.accountType ?? null,
      targetUid: 'migration:talent',
      action: 'migration.talent.updated',
      before: { accountType: 'user' },
      after: { accountType: 'talent', migrated },
      reason: 'Legacy user account migration',
    });

    return NextResponse.json({ ok: true, migrated });
  } catch (err) {
    return jsonError(err);
  }
}
