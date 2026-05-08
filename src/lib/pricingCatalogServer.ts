import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  defaultPricingCatalog,
  normalizePricingCatalog,
  validatePricingCatalog,
  type PricingCatalog,
} from "./pricing";

const PRICING_CONFIG_PATH = "platformConfig/pricing";

export type PricingConfigDocument = {
  publishedCatalog?: PricingCatalog | null;
  draftCatalog?: PricingCatalog | null;
  version?: number;
  publishedAt?: unknown;
  publishedBy?: string | null;
  updatedAt?: unknown;
  updatedBy?: string | null;
  lastPublishReason?: string | null;
};

export async function getPublishedPricingCatalog(db: Firestore): Promise<PricingCatalog> {
  const snap = await db.doc(PRICING_CONFIG_PATH).get();
  if (!snap.exists) return defaultPricingCatalog;

  const data = snap.data() as PricingConfigDocument;
  if (!data.publishedCatalog) return defaultPricingCatalog;

  return normalizePricingCatalog({
    ...data.publishedCatalog,
    version: data.version,
    publishedAt: serializeTimestamp(data.publishedAt),
  });
}

export async function getAdminPricingConfig(db: Firestore) {
  const snap = await db.doc(PRICING_CONFIG_PATH).get();
  const data = snap.exists ? snap.data() as PricingConfigDocument : {};
  const publishedCatalog = data.publishedCatalog
    ? normalizePricingCatalog({
      ...data.publishedCatalog,
      version: data.version,
      publishedAt: serializeTimestamp(data.publishedAt),
    })
    : defaultPricingCatalog;
  const draftCatalog = data.draftCatalog ? normalizePricingCatalog(data.draftCatalog) : publishedCatalog;

  return {
    publishedCatalog,
    draftCatalog,
    version: data.version ?? 0,
    publishedAt: serializeTimestamp(data.publishedAt),
    publishedBy: data.publishedBy ?? null,
    updatedAt: serializeTimestamp(data.updatedAt),
    updatedBy: data.updatedBy ?? null,
    lastPublishReason: data.lastPublishReason ?? null,
  };
}

export async function savePricingDraft(db: Firestore, catalog: PricingCatalog, uid: string) {
  const normalized = normalizePricingCatalog(catalog);
  const errors = validatePricingCatalog(normalized);
  if (errors.length > 0) {
    throw new Response(JSON.stringify({ error: errors.join(" ") }), { status: 400 });
  }

  await db.doc(PRICING_CONFIG_PATH).set({
    draftCatalog: normalized,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: uid,
  }, { merge: true });

  return normalized;
}

export async function publishPricingCatalog(db: Firestore, catalog: PricingCatalog, uid: string, reason: string) {
  const normalized = normalizePricingCatalog(catalog);
  const errors = validatePricingCatalog(normalized);
  if (errors.length > 0) {
    throw new Response(JSON.stringify({ error: errors.join(" ") }), { status: 400 });
  }

  const ref = db.doc(PRICING_CONFIG_PATH);
  const result = await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const current = snap.exists ? snap.data() as PricingConfigDocument : {};
    const nextVersion = (current.version ?? 0) + 1;
    const publishedCatalog = {
      ...normalized,
      version: nextVersion,
    };

    transaction.set(ref, {
      publishedCatalog,
      draftCatalog: publishedCatalog,
      version: nextVersion,
      publishedAt: FieldValue.serverTimestamp(),
      publishedBy: uid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
      lastPublishReason: reason.trim(),
    }, { merge: true });

    return {
      before: current.publishedCatalog ? normalizePricingCatalog(current.publishedCatalog) : defaultPricingCatalog,
      after: publishedCatalog,
      version: nextVersion,
    };
  });

  return result;
}

function serializeTimestamp(value: unknown): string | null {
  if (!value) return null;
  if (typeof value === "string") return value;
  if (value instanceof Date) return value.toISOString();
  if (typeof value === "object" && "toDate" in value && typeof value.toDate === "function") {
    return value.toDate().toISOString();
  }
  return null;
}
