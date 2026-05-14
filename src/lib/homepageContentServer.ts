import { FieldValue, type Firestore } from "firebase-admin/firestore";
import {
  defaultHomepageContent,
  normalizeHomepageContent,
  validateHomepageContent,
  type HomepageContent,
} from "./homepageContent";

const HOMEPAGE_CONFIG_PATH = "platformConfig/homepage";

export type HomepageContentConfigDocument = {
  publishedContent?: HomepageContent | null;
  draftContent?: HomepageContent | null;
  version?: number;
  publishedAt?: unknown;
  publishedBy?: string | null;
  updatedAt?: unknown;
  updatedBy?: string | null;
  lastPublishReason?: string | null;
};

export async function getPublishedHomepageContent(db: Firestore): Promise<HomepageContent> {
  const snap = await db.doc(HOMEPAGE_CONFIG_PATH).get();
  if (!snap.exists) return defaultHomepageContent;

  const data = snap.data() as HomepageContentConfigDocument;
  if (!data.publishedContent) return defaultHomepageContent;

  return normalizeHomepageContent({
    ...data.publishedContent,
    version: data.version,
    publishedAt: serializeTimestamp(data.publishedAt),
  });
}

export async function getAdminHomepageContent(db: Firestore) {
  const snap = await db.doc(HOMEPAGE_CONFIG_PATH).get();
  const data = snap.exists ? snap.data() as HomepageContentConfigDocument : {};
  const publishedContent = data.publishedContent
    ? normalizeHomepageContent({
      ...data.publishedContent,
      version: data.version,
      publishedAt: serializeTimestamp(data.publishedAt),
    })
    : defaultHomepageContent;
  const draftContent = data.draftContent ? normalizeHomepageContent(data.draftContent) : publishedContent;

  return {
    publishedContent,
    draftContent,
    version: data.version ?? 0,
    publishedAt: serializeTimestamp(data.publishedAt),
    publishedBy: data.publishedBy ?? null,
    updatedAt: serializeTimestamp(data.updatedAt),
    updatedBy: data.updatedBy ?? null,
    lastPublishReason: data.lastPublishReason ?? null,
  };
}

export async function saveHomepageDraft(db: Firestore, content: HomepageContent, uid: string) {
  const normalized = normalizeHomepageContent(content);
  const errors = validateHomepageContent(normalized);
  if (errors.length > 0) {
    throw new Response(JSON.stringify({ error: errors.join(" ") }), { status: 400 });
  }
  const draftContent = stripUndefined(normalized);

  await db.doc(HOMEPAGE_CONFIG_PATH).set({
    draftContent,
    updatedAt: FieldValue.serverTimestamp(),
    updatedBy: uid,
  }, { merge: true });

  return draftContent;
}

export async function publishHomepageContent(db: Firestore, content: HomepageContent, uid: string, reason: string) {
  const normalized = normalizeHomepageContent(content);
  const errors = validateHomepageContent(normalized);
  if (errors.length > 0) {
    throw new Response(JSON.stringify({ error: errors.join(" ") }), { status: 400 });
  }

  const ref = db.doc(HOMEPAGE_CONFIG_PATH);
  const result = await db.runTransaction(async (transaction) => {
    const snap = await transaction.get(ref);
    const current = snap.exists ? snap.data() as HomepageContentConfigDocument : {};
    const nextVersion = (current.version ?? 0) + 1;
    const publishedContent = stripUndefined({
      ...normalized,
      version: nextVersion,
    });

    transaction.set(ref, {
      publishedContent,
      draftContent: publishedContent,
      version: nextVersion,
      publishedAt: FieldValue.serverTimestamp(),
      publishedBy: uid,
      updatedAt: FieldValue.serverTimestamp(),
      updatedBy: uid,
      lastPublishReason: reason.trim(),
    }, { merge: true });

    return {
      before: current.publishedContent ? normalizeHomepageContent(current.publishedContent) : defaultHomepageContent,
      after: publishedContent,
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

function stripUndefined<T>(value: T): T {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T;
  }
  if (value && typeof value === "object" && !(value instanceof Date)) {
    return Object.entries(value as Record<string, unknown>).reduce<Record<string, unknown>>((next, [key, entry]) => {
      if (entry !== undefined) next[key] = stripUndefined(entry);
      return next;
    }, {}) as T;
  }
  return value;
}
