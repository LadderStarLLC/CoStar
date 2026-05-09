type QuerySnapshotLike = {
  empty: boolean;
  docs: Array<{ id: string }>;
};

type QueryLike = {
  get(): Promise<QuerySnapshotLike>;
};

type CollectionLike = {
  where(fieldPath: string, opStr: FirebaseFirestore.WhereFilterOp, value: unknown): CollectionLike;
  limit(limit: number): QueryLike;
};

export type UserSlugDb = {
  collection(path: 'users'): CollectionLike;
};

export function createUserSlug(value?: string | null, fallback?: string): string {
  const base = (value || fallback || 'profile')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return base || 'profile';
}

export async function isUserSlugAvailable(
  db: UserSlugDb,
  slug: string,
  excludeUid?: string
): Promise<boolean> {
  const snapshot = await db.collection('users').where('slug', '==', slug).limit(1).get();
  if (snapshot.empty) return true;
  return Boolean(excludeUid && snapshot.docs[0]?.id === excludeUid);
}

export async function generateUniqueUserSlug(
  db: UserSlugDb,
  value: string | null | undefined,
  uid: string
): Promise<string> {
  const baseSlug = createUserSlug(value, uid);
  let slug = baseSlug;
  let counter = 1;

  while (!(await isUserSlugAvailable(db, slug, uid))) {
    slug = `${baseSlug}-${counter}`;
    counter += 1;
    if (counter > 100) break;
  }

  return slug;
}
