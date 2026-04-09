'use client';

import { useState, useRef, useCallback } from 'react';
import { float32ToInt16, int16ToBase64 } from '@/lib/audition/audioUtils';
import { GEMINI_CONFIG } from '@/lib/audition/config';

interface UseAudioCaptureOptions {
  onChunk: (base64PCM: string) => void;
}

export function useAudioCapture({ onChunk }: UseAudioCaptureOptions) {
  const [hasPermission, setHasPermission] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const pausedRef = useRef(false);
  const onChunkRef = useRef(onChunk);
  onChunkRef.current = onChunk;

  const requestPermission = useCallback(async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        audio: {
          sampleRate: GEMINI_CONFIG.inputSampleRate,
          channelCount: 1,
          echoCancellation: true,
          noiseSuppression: true,
          autoGainControl: true,
        },
      });
      streamRef.current = stream;
      setHasPermission(true);
      setError(null);
      return true;
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Microphone permission denied');
      return false;
    }
  }, []);

  const startCapture = useCallback(() => {
    if (!streamRef.current) return;

    const ctx = new AudioContext({ sampleRate: GEMINI_CONFIG.inputSampleRate });
    audioContextRef.current = ctx;

    const source = ctx.createMediaStreamSource(streamRef.current);
    sourceRef.current = source;

    // ScriptProcessorNode bufferSize 4096 @ 16kHz ≈ 256ms chunks
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (pausedRef.current) return;
      const input = e.inputBuffer.getChannelData(0);
      const pcm = float32ToInt16(input);
      onChunkRef.current(int16ToBase64(pcm));
    };

    source.connect(processor);
    processor.connect(ctx.destination);
    setIsCapturing(true);
  }, []);

  const stopCapture = useCallback(() => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    audioContextRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    processorRef.current = null;
    sourceRef.current = null;
    audioContextRef.current = null;
    streamRef.current = null;
    setIsCapturing(false);
  }, []);

  // Pause/resume without stopping the stream (used while AI is speaking)
  const setPaused = useCallback((paused: boolean) => {
    pausedRef.current = paused;
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted((m) => {
      const next = !m;
      pausedRef.current = next;
      return next;
    });
  }, []);

  return {
    hasPermission,
    isMuted,
    isCapturing,
    error,
    requestPermission,
    startCapture,
    stopCapture,
    setPaused,
    toggleMute,
  };
}
