'use client';

import { useState, useRef, useCallback, useEffect } from 'react';
import { base64ToInt16, int16ToFloat32 } from '@/lib/audition/audioUtils';
import { GEMINI_CONFIG } from '@/lib/audition/config';
import type { AudioDeviceOption } from './useAudioCapture';

const PLAYBACK_SAMPLE_RATE = GEMINI_CONFIG.outputSampleRate;

type SinkCapableAudioElement = HTMLAudioElement & {
  setSinkId?: (sinkId: string) => Promise<void>;
  sinkId?: string;
};

export type SpeakerHealthStatus = 'idle' | 'ok' | 'blocked' | 'unsupported-switching' | 'no-device' | 'device-error';

export function useAudioPlayback() {
  const [isPlaying, setIsPlaying] = useState(false);
  const [outputDevices, setOutputDevices] = useState<AudioDeviceOption[]>([]);
  const [selectedOutputDeviceId, setSelectedOutputDeviceId] = useState('default');
  const [currentOutputLabel, setCurrentOutputLabel] = useState('Default speaker');
  const [outputLevel, setOutputLevel] = useState(0);
  const [speakerHealth, setSpeakerHealth] = useState<SpeakerHealthStatus>('idle');
  const [speakerError, setSpeakerError] = useState<string | null>(null);
  const [canSelectOutputDevice, setCanSelectOutputDevice] = useState(false);

  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const outputDestinationRef = useRef<MediaStreamAudioDestinationNode | null>(null);
  const outputElementRef = useRef<SinkCapableAudioElement | null>(null);
  const nextStartTimeRef = useRef(0);
  const activeSourcesRef = useRef<AudioBufferSourceNode[]>([]);
  const selectedOutputDeviceIdRef = useRef(selectedOutputDeviceId);
  const lastOutputAtRef = useRef(0);
  const levelRafRef = useRef<number>(0);
  selectedOutputDeviceIdRef.current = selectedOutputDeviceId;

  const refreshOutputDevices = useCallback(async () => {
    if (!navigator.mediaDevices?.enumerateDevices) return;
    try {
      const devices = await navigator.mediaDevices.enumerateDevices();
      const audioOutputs = devices
        .filter((device) => device.kind === 'audiooutput')
        .map((device, index) => ({
          deviceId: device.deviceId || 'default',
          label: device.label || (device.deviceId === 'default' ? 'Default speaker' : `Speaker ${index + 1}`),
        }));

      setOutputDevices(audioOutputs);
      const matched = audioOutputs.find((device) => device.deviceId === selectedOutputDeviceIdRef.current) ?? audioOutputs[0];
      setCurrentOutputLabel(matched?.label || 'Default speaker');
      setCanSelectOutputDevice(canUseSinkSelection());
    } catch {
      // Output device enumeration is best-effort and browser-dependent.
    }
  }, []);

  const ensureOutputElement = useCallback(() => {
    if (outputElementRef.current) return outputElementRef.current;

    const audio = new Audio() as SinkCapableAudioElement;
    audio.autoplay = true;
    audioElementSetup(audio);
    outputElementRef.current = audio;
    setCanSelectOutputDevice(typeof audio.setSinkId === 'function');
    return audio;
  }, []);

  const getContext = useCallback(() => {
    if (!audioCtxRef.current || audioCtxRef.current.state === 'closed') {
      const ctx = new AudioContext({ sampleRate: PLAYBACK_SAMPLE_RATE });
      const analyser = ctx.createAnalyser();
      const destination = ctx.createMediaStreamDestination();
      const outputElement = ensureOutputElement();

      analyser.fftSize = 256;
      analyser.connect(destination);
      outputElement.srcObject = destination.stream;

      audioCtxRef.current = ctx;
      analyserRef.current = analyser;
      outputDestinationRef.current = destination;
      nextStartTimeRef.current = 0;
    }
    return { ctx: audioCtxRef.current, analyser: analyserRef.current! };
  }, [ensureOutputElement]);

  useEffect(() => {
    setCanSelectOutputDevice(canUseSinkSelection());
    refreshOutputDevices();
    if (!navigator.mediaDevices?.addEventListener) return;
    navigator.mediaDevices.addEventListener('devicechange', refreshOutputDevices);
    return () => navigator.mediaDevices.removeEventListener('devicechange', refreshOutputDevices);
  }, [refreshOutputDevices]);

  useEffect(() => {
    const draw = () => {
      const analyser = analyserRef.current;
      if (analyser) {
        const data = new Uint8Array(analyser.frequencyBinCount);
        analyser.getByteFrequencyData(data);
        const average = data.reduce((sum, value) => sum + value, 0) / Math.max(data.length, 1);
        setOutputLevel(Math.min(1, average / 120));
      } else {
        setOutputLevel(0);
      }
      levelRafRef.current = requestAnimationFrame(draw);
    };
    levelRafRef.current = requestAnimationFrame(draw);
    return () => cancelAnimationFrame(levelRafRef.current);
  }, []);

  useEffect(() => {
    const timer = window.setInterval(() => {
      if (speakerError) {
        setSpeakerHealth('device-error');
        return;
      }
      if (outputDevices.length === 0 && canSelectOutputDevice) {
        setSpeakerHealth('no-device');
        return;
      }
      if (isPlaying) {
        setSpeakerHealth(Date.now() - lastOutputAtRef.current < 3500 ? 'ok' : 'blocked');
        return;
      }
      setSpeakerHealth(canSelectOutputDevice ? 'idle' : 'unsupported-switching');
    }, 750);
    return () => window.clearInterval(timer);
  }, [canSelectOutputDevice, isPlaying, outputDevices.length, speakerError]);

  const selectOutputDevice = useCallback(async (deviceId: string) => {
    const outputElement = ensureOutputElement();
    setSelectedOutputDeviceId(deviceId);
    selectedOutputDeviceIdRef.current = deviceId;

    if (typeof outputElement.setSinkId !== 'function') {
      setSpeakerHealth('unsupported-switching');
      setSpeakerError(null);
      return { selected: false, unsupported: true };
    }

    try {
      await outputElement.setSinkId(deviceId);
      setSpeakerError(null);
      const matched = outputDevices.find((device) => device.deviceId === deviceId);
      setCurrentOutputLabel(matched?.label || 'Default speaker');
      await refreshOutputDevices();
      return { selected: true };
    } catch (err) {
      const msg = err instanceof Error ? err.message : 'Could not switch speaker.';
      setSpeakerError(`Could not switch speaker: ${msg}`);
      setSpeakerHealth('device-error');
      return { selected: false, errorText: msg };
    }
  }, [ensureOutputElement, outputDevices, refreshOutputDevices]);

  const enqueueChunk = useCallback(
    async (base64PCM: string) => {
      try {
        const { ctx, analyser } = getContext();
        const outputElement = ensureOutputElement();

        if (ctx.state === 'suspended') {
          await ctx.resume();
        }

        const playPromise = outputElement.play();
        if (playPromise) {
          await playPromise;
        }

        const int16 = base64ToInt16(base64PCM);
        const float32 = int16ToFloat32(int16);

        const buffer = ctx.createBuffer(1, float32.length, PLAYBACK_SAMPLE_RATE);
        buffer.copyToChannel(new Float32Array(float32), 0);

        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(analyser);

        const now = ctx.currentTime;
        const startAt = Math.max(now, nextStartTimeRef.current);
        source.start(startAt);
        nextStartTimeRef.current = startAt + buffer.duration;
        lastOutputAtRef.current = Date.now();

        activeSourcesRef.current.push(source);
        setSpeakerError(null);
        setIsPlaying(true);

        source.onended = () => {
          activeSourcesRef.current = activeSourcesRef.current.filter((s) => s !== source);
          if (activeSourcesRef.current.length === 0) {
            setIsPlaying(false);
          }
        };
      } catch (err) {
        const msg = err instanceof Error ? err.message : 'Speaker playback failed.';
        setSpeakerError(msg);
        setSpeakerHealth('blocked');
      }
    },
    [ensureOutputElement, getContext],
  );

  const stop = useCallback(() => {
    activeSourcesRef.current.forEach((s) => {
      try {
        s.stop();
      } catch {
        // already stopped
      }
    });
    activeSourcesRef.current = [];
    nextStartTimeRef.current = 0;
    setIsPlaying(false);
    setOutputLevel(0);
  }, []);

  const close = useCallback(() => {
    stop();
    audioCtxRef.current?.close();
    audioCtxRef.current = null;
    analyserRef.current = null;
    outputDestinationRef.current = null;
    if (outputElementRef.current) {
      outputElementRef.current.pause();
      outputElementRef.current.srcObject = null;
    }
  }, [stop]);

  return {
    isPlaying,
    enqueueChunk,
    stop,
    close,
    analyserRef,
    outputDevices,
    selectedOutputDeviceId,
    currentOutputLabel,
    outputLevel,
    speakerHealth,
    speakerError,
    canSelectOutputDevice,
    refreshOutputDevices,
    selectOutputDevice,
  };
}

function audioElementSetup(audio: HTMLAudioElement) {
  audio.setAttribute('aria-hidden', 'true');
  audio.setAttribute('playsinline', 'true');
  audio.style.display = 'none';
}

function canUseSinkSelection() {
  return typeof HTMLMediaElement !== 'undefined' && 'setSinkId' in HTMLMediaElement.prototype;
}
