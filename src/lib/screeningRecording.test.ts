import { describe, expect, it, vi } from 'vitest';
import {
  buildRecordingStorageKey,
  getRecordingConfig,
  isAllowedRecordingMimeType,
  isBusinessScreeningRecordingEnabled,
  SCREENING_RECORDING_CONSENT_VERSION,
} from './screeningRecording';

describe('screening recording service helpers', () => {
  it('allows only supported recording MIME types', () => {
    expect(isAllowedRecordingMimeType('video/webm;codecs=vp8,opus')).toBe(true);
    expect(isAllowedRecordingMimeType('video/mp4')).toBe(true);
    expect(isAllowedRecordingMimeType('text/html')).toBe(false);
  });

  it('requires server feature flag and business screening type', () => {
    vi.stubEnv('RECORDED_SCREENINGS_ENABLED', 'true');
    expect(isBusinessScreeningRecordingEnabled({
      id: 'link',
      data: { recordingEnabled: true, sessionType: 'business_screening' },
    })).toBe(true);
    expect(isBusinessScreeningRecordingEnabled({
      id: 'link',
      data: { recordingEnabled: true, sessionType: 'practice' },
    })).toBe(false);
    vi.unstubAllEnvs();
  });

  it('builds safe generated storage keys', () => {
    expect(buildRecordingStorageKey({
      businessUid: 'biz/one',
      linkId: 'link.two',
      recordingId: 'rec three',
      mimeType: 'video/webm',
    })).toBe('business-screenings/biz_one/link_two/rec_three.webm');
  });

  it('uses conservative defaults', () => {
    vi.unstubAllEnvs();
    expect(getRecordingConfig().retentionDays).toBe(90);
    expect(SCREENING_RECORDING_CONSENT_VERSION).toBe('business-screening-recording-v1');
  });
});
