import { describe, expect, it } from 'vitest';
import { isClientVercelPreview, isPreviewAuthEnabled, isVercelPreview, previewBusinessProfile } from './deploymentMode';

describe('deployment mode helpers', () => {
  it('detects Vercel preview from server env', () => {
    expect(isVercelPreview({ VERCEL_ENV: 'preview' })).toBe(true);
    expect(isVercelPreview({ VERCEL_ENV: 'production' })).toBe(false);
  });

  it('requires preview env and a server secret for preview auth', () => {
    expect(isPreviewAuthEnabled({ VERCEL_ENV: 'preview', PREVIEW_AUTH_SECRET: 'secret' })).toBe(true);
    expect(isPreviewAuthEnabled({ VERCEL_ENV: 'preview' })).toBe(false);
    expect(isPreviewAuthEnabled({ VERCEL_ENV: 'production', PREVIEW_AUTH_SECRET: 'secret' })).toBe(false);
  });

  it('detects client preview env without exposing the server secret', () => {
    expect(isClientVercelPreview({ NEXT_PUBLIC_VERCEL_ENV: 'preview' })).toBe(true);
    expect(isClientVercelPreview({ NEXT_PUBLIC_VERCEL_ENV: 'production' })).toBe(false);
  });

  it('uses a non-privileged business preview persona', () => {
    expect(previewBusinessProfile.uid).toBe('preview-business-user');
    expect(previewBusinessProfile.accountType).toBe('business');
    expect(previewBusinessProfile.role).toBe('business');
  });
});
