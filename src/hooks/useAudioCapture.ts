'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { float32ToInt16, int16ToBase64, resampleFloat32PCM } from '@/lib/audition/audioUtils';
import { GEMINI_CONFIG } from '@/lib/audition/config';

interface UseAudioCaptureOptions {
  onChunk: (base64PCM: string) => void;
}

export type MicConnectionStatus = 'unsupported' | 'unknown' | 'prompt' | 'granted' | 'denied' | 'capturing' | 'error';
export type MicHealthStatus = 'idle' | 'ok' | 'muted' | 'silent' | 'permission-blocked' | 'no-device' | 'device-error';

export interface AudioDeviceOption {
  deviceId: string;
  label: string;
}

export function useAudioCapture({ onChunk }: UseAudioCaptureOptions) {
  const [hasPermission, setHasPermission] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [isCapturing, setIsCapturing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [permissionState, setPermissionState] = useState<PermissionState | 'unsupported' | 'unknown'>('unknown');
  const [inputDevices, setInputDevices] = useState<AudioDeviceOption[]>([]);
  const [selectedInputDeviceId, setSelectedInputDeviceId] = useState('default');
  const [currentInputLabel, setCurrentInputLabel] = useState('Default microphone');
  const [inputLevel, setInputLevel] = useState(0);
  const [micHealth, setMicHealth] = useState<MicHealthStatus>('idle');
  const [captureStartedAt, setCaptureStartedAt] = useState<number | null>(null);
  const [lastSignalAt, setLastSignalAt] = useState<number | null>(null);

  const audioContextRef = useRef<AudioContext | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const processorRef = useRef<ScriptProcessorNode | null>(null);
  const sourceRef = useRef<MediaStreamAudioSourceNode | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const pausedRef = useRef(false);
  const loggedFirstChunkRef = useRef(false);
  const diagnosticChunkCountRef = useRef(0);
  const lastSignalAtRef = useRef(0);
  const lastLevelUpdateAtRef = useRef(0);
  const selectedInputDeviceIdRef = useRef(selectedInputDeviceId);
  const onChunkRef = useRef(onChunk);
  onChunkRef.current = onChunk;
  selectedInputDeviceIdRef.current = selectedInputDeviceId;

  const getAudioConstraints = useCallback((deviceId: string): MediaStreamConstraints => {
    if (!deviceId || deviceId === 'default') return { audio: true };
    return { audio: { deviceId: { exact: deviceId } } };
  }, []);

  const refreshInputDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices
        .filter((device) => device.kind === 'audioinput')
        .map((device, index) => ({
          deviceId: device.deviceId || 'default',
          label: device.label || (device.deviceId === 'default' ? 'Default microphone' : `Microphone ${index + 1}`),
        }));

      setInputDevices(audioInputs);

      const activeTrack = streamRef.current?.getAudioTracks()[0];
      const activeSettings = activeTrack?.getSettings();
      const activeId = activeSettings?.deviceId || selectedInputDeviceIdRef.current;
      const matched = audioInputs.find((device) => device.deviceId === activeId) ?? audioInputs[0];
      setCurrentInputLabel(activeTrack?.label || matched?.label || 'Default microphone');
    } catch {
      // Device labels are best-effort and can be hidden until permission is granted.
    }
  }, []);

  useEffect(() => {
    refreshInputDevices();
    if (!navigator.mediaDevices?.addEventListener) return;
    navigator.mediaDevices.addEventListener('devicechange', refreshInputDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', refreshInputDevices);
  }, [refreshInputDevices]);

  useEffect(() => {
    let permissionStatus: PermissionStatus | null = null;
    let handleChange: (() => void) | null = null;
    let disposed = false;

    async function readPermissionStatus() {
      if (!navigator.mediaDevices?.getUserMedia) {
        setPermissionState('unsupported');
        return;
      }

      if (!navigator.permissions?.query) {
        setPermissionState('unknown');
        return;
      }

      try {
        permissionStatus = await navigator.permissions.query({ name: 'microphone' as PermissionName });
        if (disposed) return;

        const updateState = () => setPermissionState(permissionStatus?.state ?? 'unknown');
        handleChange = updateState;
        updateState();
        permissionStatus.addEventListener('change', updateState);
      } catch {
        setPermissionState('unknown');
      }
    }

    readPermissionStatus();

    return () => {
      disposed = true;
      if (permissionStatus && handleChange) {
        permissionStatus.removeEventListener('change', handleChange);
      }
    };
  }, []);

  useEffect(() => {
    if (!isCapturing) {
      setInputLevel(0);
      if (error) setMicHealth('device-error');
      else if (permissionState === 'denied') setMicHealth('permission-blocked');
      else setMicHealth('idle');
      return;
    }

    const timer = window.setInterval(() => {
      if (pausedRef.current || isMuted) {
        setMicHealth('muted');
        return;
      }
      if (inputDevices.length === 0) {
        setMicHealth('no-device');
        return;
      }
      if (error) {
        setMicHealth('device-error');
        return;
      }
      const hasRecentSignal = Date.now() - lastSignalAtRef.current < 3500;
      setMicHealth(hasRecentSignal ? 'ok' : 'silent');
    }, 750);

    return () => window.clearInterval(timer);
  }, [error, inputDevices.length, isCapturing, isMuted, permissionState]);

  const requestPermission = useCallback(async () => {
    if (!navigator.mediaDevices?.getUserMedia) {
      const msg = 'Microphone requires a secure connection (HTTPS or localhost).';
      setError(msg);
      return { granted: false, errorText: msg };
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(getAudioConstraints(selectedInputDeviceIdRef.current));
      streamRef.current = stream;
      setHasPermission(true);
      setPermissionState('granted');
      setError(null);
      setCurrentInputLabel(stream.getAudioTracks()[0]?.label || 'Default microphone');
      refreshInputDevices();
      try { localStorage.setItem('micPermissionGranted', 'true'); } catch (e) {}
      return { granted: true };
    } catch (err) {
      const name = err instanceof DOMException ? err.name : '';
      const raw = err instanceof Error ? err.message : String(err);
      let msg: string;
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        msg = 'Browser blocked microphone access. Click the lock icon in the address bar and allow Microphone.';
      } else if (name === 'NotFoundError' || name === 'DevicesNotFoundError') {
        msg = "Windows is blocking microphone access. Go to: Windows Settings -> Privacy & Security -> Microphone -> turn ON 'Let apps access your microphone' AND enable your browser (Chrome/Edge) in the list below.";
      } else if (name === 'NotReadableError' || name === 'TrackStartError') {
        msg = 'Microphone is in use by another app. Close other apps using the mic and try again.';
      } else if (name === 'OverconstrainedError') {
        msg = 'Microphone does not support the required audio format. Try a different device.';
      } else {
        msg = `Microphone error (${name || 'unknown'}): ${raw}`;
      }
      setError(msg);
      setMicHealth('device-error');
      if (name === 'NotAllowedError' || name === 'PermissionDeniedError') {
        setPermissionState('denied');
        setMicHealth('permission-blocked');
      }
      return { granted: false, errorText: msg };
    }
  }, [getAudioConstraints, refreshInputDevices]);

  const preloadPermission = useCallback(async () => {
    if (localStorage.getItem('micPermissionGranted') === 'true') return;
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach((t) => t.stop());
      localStorage.setItem('micPermissionGranted', 'true');
      refreshInputDevices();
    } catch {
      // Main requestPermission will surface the actionable error.
    }
  }, [refreshInputDevices]);

  const diagnoseMic = useCallback(async () => {
    const lines: string[] = [];
    try {
      if (!navigator.mediaDevices) {
        return ['navigator.mediaDevices is undefined - not a secure context (need HTTPS or localhost).'];
      }
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioInputs = devices.filter((d) => d.kind === 'audioinput');
      if (audioInputs.length === 0) {
        lines.push('No audioinput devices found by the browser.');
        lines.push('This usually means Windows Privacy Settings are blocking device enumeration.');
        lines.push('Fix: Windows Settings -> Privacy & Security -> Microphone -> Enable for this browser.');
      } else {
        lines.push(`Found ${audioInputs.length} audio input device(s):`);
        audioInputs.forEach((d, i) => {
          lines.push(`  [${i + 1}] ${d.label || '(label hidden - permission not yet granted)'} | id: ${d.deviceId.slice(0, 16)}...`);
        });
        if (audioInputs.every((d) => !d.label)) {
          lines.push('');
          lines.push('All labels are hidden - browser has no mic permission yet. Click Test Microphone to grant it.');
        }
      }
    } catch (err) {
      lines.push(`enumerateDevices() threw: ${err instanceof Error ? err.message : String(err)}`);
    }
    return lines;
  }, []);

  const startCapture = useCallback(async () => {
    if (!streamRef.current) return;

    const AudioContextCtor =
      window.AudioContext ||
      (window as typeof window & { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;

    if (!AudioContextCtor) {
      setError('This browser does not support microphone audio capture.');
      setMicHealth('device-error');
      return;
    }

    const ctx = new AudioContextCtor({ sampleRate: GEMINI_CONFIG.inputSampleRate });
    audioContextRef.current = ctx;
    loggedFirstChunkRef.current = false;
    diagnosticChunkCountRef.current = 0;
    lastSignalAtRef.current = 0;
    const startedAt = Date.now();
    setCaptureStartedAt(startedAt);
    setLastSignalAt(null);
    setInputLevel(0);

    if (ctx.state === 'suspended') {
      await ctx.resume();
    }

    const source = ctx.createMediaStreamSource(streamRef.current);
    sourceRef.current = source;
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 1024;
    analyser.smoothingTimeConstant = 0.75;
    analyserRef.current = analyser;

    // ScriptProcessorNode bufferSize 4096 @ 16kHz is about 256ms chunks.
    const processor = ctx.createScriptProcessor(4096, 1, 1);
    processorRef.current = processor;

    processor.onaudioprocess = (e) => {
      if (pausedRef.current) return;
      const input = e.inputBuffer.getChannelData(0);
      const sourceSampleRate = e.inputBuffer.sampleRate || ctx.sampleRate;
      const resampled = resampleFloat32PCM(input, sourceSampleRate, GEMINI_CONFIG.inputSampleRate);
      const pcm = float32ToInt16(resampled);
      const base64 = int16ToBase64(pcm);
      let sumSquares = 0;
      let peak = 0;
      for (let i = 0; i < input.length; i++) {
        const sample = Math.abs(input[i]);
        peak = Math.max(peak, sample);
        sumSquares += input[i] * input[i];
      }
      const rms = Math.sqrt(sumSquares / Math.max(input.length, 1));
      if (rms > 0.01 || peak > 0.04) {
        const signalAt = Date.now();
        lastSignalAtRef.current = signalAt;
        setLastSignalAt(signalAt);
      }
      if (Date.now() - lastLevelUpdateAtRef.current > 100) {
        lastLevelUpdateAtRef.current = Date.now();
        setInputLevel(Math.min(1, Math.max(rms * 18, peak * 0.85)));
      }

      const shouldLogMicDiagnostic = diagnosticChunkCountRef.current < 8;
      if (shouldLogMicDiagnostic) {
        diagnosticChunkCountRef.current += 1;
      }
      if (!loggedFirstChunkRef.current) {
        loggedFirstChunkRef.current = true;
        console.log('[AudioCapture] first chunk', {
          sourceSampleRate,
          contextSampleRate: ctx.sampleRate,
          targetSampleRate: GEMINI_CONFIG.inputSampleRate,
          sourceFrames: input.length,
          resampledFrames: resampled.length,
          base64Length: base64.length,
          rms: Number(rms.toFixed(5)),
          peak: Number(peak.toFixed(5)),
        });
      } else if (shouldLogMicDiagnostic) {
        console.log('[AudioCapture] mic signal', {
          chunk: diagnosticChunkCountRef.current,
          rms: Number(rms.toFixed(5)),
          peak: Number(peak.toFixed(5)),
        });
      }
      onChunkRef.current(base64);
    };

    source.connect(analyser);
    source.connect(processor);
    processor.connect(ctx.destination);
    setIsCapturing(true);
    refreshInputDevices();
  }, [refreshInputDevices]);

  const stopCapture = useCallback(() => {
    processorRef.current?.disconnect();
    sourceRef.current?.disconnect();
    analyserRef.current?.disconnect();
    audioContextRef.current?.close();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    processorRef.current = null;
    sourceRef.current = null;
    analyserRef.current = null;
    audioContextRef.current = null;
    streamRef.current = null;
    setIsCapturing(false);
    setInputLevel(0);
    setCaptureStartedAt(null);
    setLastSignalAt(null);
  }, []);

  const selectInputDevice = useCallback(async (deviceId: string) => {
    setSelectedInputDeviceId(deviceId);
    selectedInputDeviceIdRef.current = deviceId;
    const wasCapturing = isCapturing;

    if (wasCapturing) {
      processorRef.current?.disconnect();
      sourceRef.current?.disconnect();
      analyserRef.current?.disconnect();
      audioContextRef.current?.close();
      streamRef.current?.getTracks().forEach((t) => t.stop());
      processorRef.current = null;
      sourceRef.current = null;
      analyserRef.current = null;
      audioContextRef.current = null;
      streamRef.current = null;
      setIsCapturing(false);
      setCaptureStartedAt(null);
      setLastSignalAt(null);
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia(getAudioConstraints(deviceId));
      streamRef.current = stream;
      setHasPermission(true);
      setPermissionState('granted');
      setError(null);
      setCurrentInputLabel(stream.getAudioTracks()[0]?.label || 'Default microphone');
      await refreshInputDevices();
      if (wasCapturing) {
        await startCapture();
      }
      return { selected: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not switch microphone.';
      setError(`Could not switch microphone: ${msg}`);
      setMicHealth('device-error');
      return { selected: false, errorText: msg };
    }
  }, [getAudioConstraints, isCapturing, refreshInputDevices, startCapture]);

  // Pause/resume without stopping the stream. Normal AI playback should not pause capture.
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

  const micStatus: MicConnectionStatus = (() => {
    if (isCapturing) return 'capturing';
    if (error) return 'error';
    if (permissionState === 'unsupported') return 'unsupported';
    if (permissionState === 'denied') return 'denied';
    if (hasPermission || permissionState === 'granted') return 'granted';
    if (permissionState === 'prompt') return 'prompt';
    return 'unknown';
  })();

  return {
    analyserRef,
    hasPermission,
    isMuted,
    isCapturing,
    error,
    micStatus,
    micHealth,
    permissionState,
    inputDevices,
    selectedInputDeviceId,
    currentInputLabel,
    inputLevel,
    captureStartedAt,
    lastSignalAt,
    requestPermission,
    preloadPermission,
    diagnoseMic,
    refreshInputDevices,
    selectInputDevice,
    startCapture,
    stopCapture,
    setPaused,
    toggleMute,
  };
}
