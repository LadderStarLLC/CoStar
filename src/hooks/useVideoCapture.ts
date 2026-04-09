'use client';

// Phase 2 STUB — all exports are no-ops in Phase 1 (voice-only)
// To activate: implement getUserMedia({ video: true }), canvas frame capture at ~1fps,
// and wire sendVideoFrame into useGeminiLiveSession via realtimeInput.video messages.

import { useCallback } from 'react';

export function useVideoCapture() {
  const startVideo = useCallback(async () => {
    // Phase 2: getUserMedia({ video: { width: 640, height: 480 } })
    return false;
  }, []);

  const stopVideo = useCallback(() => {
    // Phase 2: stop video track, clear canvas interval
  }, []);

  return {
    isVideoActive: false,
    videoRef: null as null, // Phase 2: ref to <video> element
    startVideo,
    stopVideo,
  };
}
