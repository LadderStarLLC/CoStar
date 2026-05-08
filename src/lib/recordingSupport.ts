export type RecordingSupportResult = {
  supported: boolean;
  reason?: 'no-media-devices' | 'no-media-recorder';
};

type RecordingWindow = {
  navigator?: Navigator;
  MediaRecorder?: typeof MediaRecorder;
};

export function getRecordingSupport(win: RecordingWindow | undefined = typeof window === 'undefined' ? undefined : window as unknown as RecordingWindow): RecordingSupportResult {
  if (!win?.navigator?.mediaDevices?.getUserMedia) {
    return { supported: false, reason: 'no-media-devices' };
  }
  if (!win.MediaRecorder) {
    return { supported: false, reason: 'no-media-recorder' };
  }
  return { supported: true };
}

export function getPreferredRecordingMimeType(mediaRecorder: typeof MediaRecorder | undefined = typeof MediaRecorder === 'undefined' ? undefined : MediaRecorder) {
  if (!mediaRecorder?.isTypeSupported) return 'video/webm';
  if (mediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')) return 'video/webm;codecs=vp9,opus';
  if (mediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')) return 'video/webm;codecs=vp8,opus';
  if (mediaRecorder.isTypeSupported('video/webm')) return 'video/webm';
  if (mediaRecorder.isTypeSupported('video/mp4')) return 'video/mp4';
  return '';
}
