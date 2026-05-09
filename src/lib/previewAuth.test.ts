import { describe, expect, it } from 'vitest';
import { PREVIEW_AUTH_COOKIE } from './deploymentMode';
import { createPreviewSessionToken, getPreviewSessionFromRequest, verifyPreviewSessionToken } from './previewAuth';

describe('preview auth session helpers', () => {
  it('verifies signed preview session tokens', () => {
    const token = createPreviewSessionToken('secret');
    expect(verifyPreviewSessionToken(token, 'secret')?.uid).toBe('preview-business-user');
  });

  it('rejects wrong secrets and expired sessions', () => {
    const token = createPreviewSessionToken('secret', 1000);
    expect(verifyPreviewSessionToken(token, 'wrong', 2000)).toBeNull();
    expect(verifyPreviewSessionToken(token, 'secret', 13 * 60 * 60 * 1000)).toBeNull();
  });

  it('resolves preview session from cookies only when preview auth is enabled', () => {
    const token = createPreviewSessionToken('secret');
    const req = new Request('https://preview.test', {
      headers: { cookie: `${PREVIEW_AUTH_COOKIE}=${encodeURIComponent(token)}` },
    });
    expect(getPreviewSessionFromRequest(req, { VERCEL_ENV: 'preview', PREVIEW_AUTH_SECRET: 'secret' })?.uid).toBe('preview-business-user');
    expect(getPreviewSessionFromRequest(req, { VERCEL_ENV: 'production', PREVIEW_AUTH_SECRET: 'secret' })).toBeNull();
  });
});
