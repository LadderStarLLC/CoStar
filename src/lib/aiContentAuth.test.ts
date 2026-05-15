import { describe, expect, it } from 'vitest';
import { getBearerToken, isAiContentApiConfigured, isValidAiContentToken, requireAiContentAccess } from './aiContentAuth';

const env = { AI_CONTENT_API_TOKEN: 'secret-token' } as NodeJS.ProcessEnv;

describe('AI content API auth', () => {
  it('detects whether the machine token is configured', () => {
    expect(isAiContentApiConfigured(env)).toBe(true);
    expect(isAiContentApiConfigured({} as NodeJS.ProcessEnv)).toBe(false);
  });

  it('extracts bearer tokens from authorization headers', () => {
    const req = new Request('https://example.test/api/ai/content/manifest', {
      headers: { Authorization: 'Bearer secret-token' },
    });

    expect(getBearerToken(req)).toBe('secret-token');
  });

  it('accepts only the configured content API token', () => {
    expect(isValidAiContentToken('secret-token', env)).toBe(true);
    expect(isValidAiContentToken('wrong-token', env)).toBe(false);
    expect(isValidAiContentToken(null, env)).toBe(false);
  });

  it('returns 404 when the route is not configured and 401 for bad credentials', () => {
    const req = new Request('https://example.test/api/ai/content/manifest');
    expect(requireAiContentAccess(req, {} as NodeJS.ProcessEnv)?.status).toBe(404);
    expect(requireAiContentAccess(req, env)?.status).toBe(401);
  });

  it('allows requests with the configured bearer token', () => {
    const req = new Request('https://example.test/api/ai/content/manifest', {
      headers: { Authorization: 'Bearer secret-token' },
    });
    expect(requireAiContentAccess(req, env)).toBeNull();
  });
});
