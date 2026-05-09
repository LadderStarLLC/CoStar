export type DeleteSource = 'user' | 'admin' | 'retention' | 'preview';

export function buildSoftDeleteMetadata(input: {
  deletedAt: unknown;
  deletedBy?: string | null;
  deletionReason?: string | null;
  deleteSource?: DeleteSource;
}) {
  return {
    deletedAt: input.deletedAt,
    deletedBy: input.deletedBy ?? null,
    deletionReason: input.deletionReason ?? null,
    deleteSource: input.deleteSource ?? 'user',
  };
}

export function isSoftDeleted(record: { deletedAt?: unknown; status?: string } | null | undefined): boolean {
  return Boolean(record?.deletedAt || record?.status === 'deleted' || record?.status === 'removed');
}
