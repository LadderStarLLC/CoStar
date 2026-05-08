import { describe, expect, it, vi } from 'vitest';
import { getPreferredRecordingMimeType, getRecordingSupport } from './recordingSupport';

describe('recording support detection', () => {
  it('rejects browsers without media devices', () => {
    expect(getRecordingSupport({ navigator: {} as Navigator, MediaRecorder: vi.fn() as unknown as typeof MediaRecorder })).toEqual({
      supported: false,
      reason: 'no-media-devices',
    });
  });

  it('rejects browsers without MediaRecorder', () => {
    expect(getRecordingSupport({
      navigator: { mediaDevices: { getUserMedia: vi.fn() } } as unknown as Navigator,
      MediaRecorder: undefined as unknown as typeof MediaRecorder,
    })).toEqual({
      supported: false,
      reason: 'no-media-recorder',
    });
  });

  it('chooses the first supported recording MIME type', () => {
    const mediaRecorder = {
      isTypeSupported: (mimeType: string) => mimeType === 'video/webm',
    } as unknown as typeof MediaRecorder;
    expect(getPreferredRecordingMimeType(mediaRecorder)).toBe('video/webm');
  });
});
