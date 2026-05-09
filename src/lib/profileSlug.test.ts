import { describe, expect, it } from 'vitest';
import { generateUniqueUserSlug, type UserSlugDb } from './profileSlug';

function createMockDb(slugOwners: Record<string, string>): UserSlugDb {
  return {
    collection() {
      return {
        where(_fieldPath, _opStr, value) {
          return {
            where: this.where,
            limit() {
              return {
                async get() {
                  const owner = slugOwners[String(value)];
                  return owner
                    ? { empty: false, docs: [{ id: owner }] }
                    : { empty: true, docs: [] };
                },
              };
            },
          };
        },
        limit() {
          throw new Error('Unexpected limit call before where.');
        },
      };
    },
  };
}

describe('profile slug generation', () => {
  it('returns the base slug when no collision exists', async () => {
    await expect(generateUniqueUserSlug(createMockDb({}), 'Acme Inc.', 'uid-1')).resolves.toBe('acme-inc');
  });

  it('appends a numeric suffix when another user owns the slug', async () => {
    await expect(generateUniqueUserSlug(createMockDb({ 'acme-inc': 'uid-2' }), 'Acme Inc.', 'uid-1')).resolves.toBe('acme-inc-1');
  });

  it('treats the caller-owned slug as available', async () => {
    await expect(generateUniqueUserSlug(createMockDb({ 'acme-inc': 'uid-1' }), 'Acme Inc.', 'uid-1')).resolves.toBe('acme-inc');
  });

  it('falls back to a uid-derived slug when the provided name is empty', async () => {
    await expect(generateUniqueUserSlug(createMockDb({}), '', 'uid-1')).resolves.toBe('uid-1');
  });
});
