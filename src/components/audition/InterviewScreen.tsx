'use client';

import type React from 'react';
import { AlertTriangle, MicOff, Mic, PhoneOff, Volume2, X } from 'lucide-react';
import type { AIStatus, TranscriptEntry } from '@/lib/audition/types';
import type { AudioDeviceOption, MicHealthStatus } from '@/hooks/useAudioCapture';
import type { SpeakerHealthStatus } from '@/hooks/useAudioPlayback';
import { AudioVisualizer } from './AudioVisualizer';
import { TranscriptPanel } from './TranscriptPanel';
import { VideoPreview } from './VideoPreview';

interface InterviewScreenProps {
  jobTitle: string;
  companyName: string;
  voiceName: string;
  aiStatus: AIStatus;
  isConnecting: boolean;
  isMuted: boolean;
  entries: TranscriptEntry[];
  analyserRef: React.MutableRefObject<AnalyserNode | null>;
  inputDevices: AudioDeviceOption[];
  selectedInputDeviceId: string;
  currentInputLabel: string;
  inputLevel: number;
  micHealth: MicHealthStatus;
  outputDevices: AudioDeviceOption[];
  selectedOutputDeviceId: string;
  currentOutputLabel: string;
  outputLevel: number;
  speakerHealth: SpeakerHealthStatus;
  speakerError: string | null;
  canSelectOutputDevice: boolean;
  onSelectInputDevice: (deviceId: string) => void;
  onSelectOutputDevice: (deviceId: string) => void;
  onToggleMute: () => void;
  onEndInterview: () => void;
  onCancelInterview: () => void;
}

export function InterviewScreen({
  jobTitle,
  companyName,
  voiceName,
  aiStatus,
  isConnecting,
  isMuted,
  entries,
  analyserRef,
  inputDevices,
  selectedInputDeviceId,
  currentInputLabel,
  inputLevel,
  micHealth,
  outputDevices,
  selectedOutputDeviceId,
  currentOutputLabel,
  outputLevel,
  speakerHealth,
  speakerError,
  canSelectOutputDevice,
  onSelectInputDevice,
  onSelectOutputDevice,
  onToggleMute,
  onEndInterview,
  onCancelInterview,
}: InterviewScreenProps) {
  const statusLabel: Record<AIStatus, string> = {
    idle: 'Connecting...',
    processing: 'Thinking...',
    speaking: `${voiceName} is speaking`,
    listening: entries.length === 0 ? 'Please speak to begin' : 'Listening',
  };

  const statusColor: Record<AIStatus, string> = {
    idle: 'text-slate-400',
    processing: 'text-amber-400',
    speaking: 'text-violet-300',
    listening: 'text-emerald-400',
  };

  const statusDetail: Record<AIStatus, string> = {
    idle: 'Preparing your live audition session.',
    processing: 'Reviewing your last response.',
    speaking: 'The interviewer is asking or following up.',
    listening: entries.length === 0
      ? 'Start with a short answer or greeting when you are ready.'
      : 'Speak naturally, then pause so the interviewer can respond.',
  };

  const initial = voiceName.charAt(0).toUpperCase();
  const warnings = [
    getMicHealthMessage(micHealth),
    getSpeakerHealthMessage(speakerHealth, speakerError),
  ].filter(Boolean) as string[];

  return (
    <div className="min-h-screen bg-slate-900 flex flex-col">
      <div className="flex items-center justify-between px-5 py-4 border-b border-slate-800/60">
        <div>
          <p className="text-white font-semibold text-sm">{jobTitle}</p>
          <p className="text-slate-500 text-xs">{companyName}</p>
        </div>
        <div className="flex items-center gap-3">
          {isConnecting ? (
            <div className="flex items-center gap-2 text-amber-400 text-xs font-medium">
              <div className="w-2 h-2 rounded-full bg-amber-400 animate-pulse" />
              Connecting...
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <div
                className={`w-2 h-2 rounded-full ${
                  aiStatus === 'listening' ? 'bg-emerald-400 animate-pulse' : 'bg-violet-400'
                }`}
              />
              <span className={`text-xs font-medium ${statusColor[aiStatus]}`}>
                {statusLabel[aiStatus]}
              </span>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 flex flex-col items-center justify-between px-5 py-6 gap-5">
        <div className="flex flex-col items-center gap-3">
          <div className="w-20 h-20 rounded-full bg-gradient-to-br from-violet-700 to-purple-900 border border-violet-500/30 flex items-center justify-center shadow-lg shadow-violet-900/30">
            <span className="text-2xl font-bold text-violet-200">{initial}</span>
          </div>
          <p className="text-slate-400 text-sm font-medium">{voiceName} · AI Interviewer</p>
          <AudioVisualizer analyserRef={analyserRef} aiStatus={aiStatus} />
          <div className="text-center space-y-1">
            <div className={`text-sm font-semibold ${isMuted ? 'text-red-300' : statusColor[aiStatus]}`}>
              {isConnecting ? 'Connecting...' : isMuted ? 'Muted' : statusLabel[aiStatus]}
            </div>
            <p className="max-w-xs text-xs leading-relaxed text-slate-500">
              {isMuted ? 'Unmute when you are ready to answer.' : statusDetail[aiStatus]}
            </p>
          </div>
        </div>

        <div className="w-full max-w-4xl grid gap-3 md:grid-cols-2">
          <AudioDeviceCard
            title="Your microphone"
            icon={<Mic className="w-4 h-4" />}
            status={getMicStatusLabel(micHealth)}
            statusClass={getMicStatusClass(micHealth)}
            deviceLabel={currentInputLabel}
            level={isMuted ? 0 : inputLevel}
            devices={inputDevices}
            selectedDeviceId={selectedInputDeviceId}
            selectDisabled={inputDevices.length === 0}
            onSelectDevice={onSelectInputDevice}
          />
          <AudioDeviceCard
            title="Speaker output"
            icon={<Volume2 className="w-4 h-4" />}
            status={getSpeakerStatusLabel(speakerHealth)}
            statusClass={getSpeakerStatusClass(speakerHealth)}
            deviceLabel={currentOutputLabel}
            level={outputLevel}
            devices={outputDevices}
            selectedDeviceId={selectedOutputDeviceId}
            selectDisabled={!canSelectOutputDevice || outputDevices.length === 0}
            selectHint={!canSelectOutputDevice ? 'Speaker switching is not supported by this browser.' : undefined}
            onSelectDevice={onSelectOutputDevice}
          />
        </div>

        {warnings.length > 0 && (
          <div className="w-full max-w-4xl rounded-lg border border-amber-500/30 bg-amber-500/10 p-3">
            <div className="flex items-start gap-2">
              <AlertTriangle className="mt-0.5 h-4 w-4 flex-none text-amber-300" />
              <div className="space-y-1">
                <p className="text-xs font-semibold text-amber-200">Audio check</p>
                {warnings.map((warning) => (
                  <p key={warning} className="text-xs leading-relaxed text-amber-100/90">
                    {warning}
                  </p>
                ))}
              </div>
            </div>
          </div>
        )}

        <VideoPreview />

        <div className="w-full max-w-2xl flex-1 flex flex-col bg-slate-800/30 rounded-2xl border border-slate-700/40 p-4 min-h-0 max-h-64 overflow-hidden">
          <p className="text-slate-500 text-xs font-medium mb-3 uppercase tracking-wide">
            Live Transcript
          </p>
          <TranscriptPanel entries={entries} />
        </div>
      </div>

      <div className="flex items-center justify-center gap-3 px-5 py-5 border-t border-slate-800/60">
        <button
          onClick={onToggleMute}
          className={`flex items-center gap-2 px-4 py-2.5 rounded-xl border text-sm font-medium transition-all ${
            isMuted
              ? 'bg-red-500/15 border-red-500/40 text-red-300 hover:bg-red-500/20'
              : 'bg-slate-800/60 border-slate-700/50 text-slate-300 hover:border-slate-600'
          }`}
        >
          {isMuted ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
          {isMuted ? 'Unmute' : 'Mute'}
        </button>

        <button
          onClick={onEndInterview}
          className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-red-600/20 border border-red-500/40 text-red-300 hover:bg-red-600/30 text-sm font-medium transition-all"
        >
          <PhoneOff className="w-4 h-4" />
          End Interview
        </button>

        <button
          onClick={onCancelInterview}
          className="flex items-center gap-2 px-3 py-2.5 rounded-xl bg-slate-800/60 border border-slate-700/50 text-slate-300 hover:text-white hover:border-slate-600 text-sm transition-all"
          title="Cancel without saving"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

function AudioDeviceCard({
  title,
  icon,
  status,
  statusClass,
  deviceLabel,
  level,
  devices,
  selectedDeviceId,
  selectDisabled,
  selectHint,
  onSelectDevice,
}: {
  title: string;
  icon: React.ReactNode;
  status: string;
  statusClass: string;
  deviceLabel: string;
  level: number;
  devices: AudioDeviceOption[];
  selectedDeviceId: string;
  selectDisabled: boolean;
  selectHint?: string;
  onSelectDevice: (deviceId: string) => void;
}) {
  return (
    <div className="rounded-lg border border-slate-700/60 bg-slate-800/45 p-4">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-slate-300">
            {icon}
            <p className="text-xs font-semibold uppercase tracking-wide">{title}</p>
          </div>
          <p className="mt-2 truncate text-sm font-medium text-white" title={deviceLabel}>
            {deviceLabel}
          </p>
        </div>
        <span className={`whitespace-nowrap text-xs font-semibold ${statusClass}`}>{status}</span>
      </div>

      <LevelMeter level={level} />

      <select
        value={devices.some((device) => device.deviceId === selectedDeviceId) ? selectedDeviceId : devices[0]?.deviceId ?? 'default'}
        disabled={selectDisabled}
        onChange={(event) => onSelectDevice(event.target.value)}
        title={selectHint}
        className="mt-3 w-full rounded-md border border-slate-700 bg-slate-950/70 px-3 py-2 text-xs text-slate-200 outline-none transition focus:border-violet-400 disabled:cursor-not-allowed disabled:opacity-55"
      >
        {devices.length > 0 ? (
          devices.map((device) => (
            <option key={device.deviceId} value={device.deviceId}>
              {device.label}
            </option>
          ))
        ) : (
          <option value="default">Default device</option>
        )}
      </select>

      {selectHint && <p className="mt-2 text-xs text-slate-500">{selectHint}</p>}
    </div>
  );
}

function LevelMeter({ level }: { level: number }) {
  const bars = Array.from({ length: 18 }, (_, index) => index);
  const activeBars = Math.round(Math.max(0, Math.min(1, level)) * bars.length);

  return (
    <div className="mt-4 flex h-10 items-end gap-1" aria-hidden="true">
      {bars.map((bar) => {
        const height = 20 + ((bar % 6) + 1) * 10;
        const isActive = bar < activeBars;
        return (
          <div
            key={bar}
            className={`flex-1 rounded-sm transition-colors ${isActive ? 'bg-emerald-400' : 'bg-slate-700/70'}`}
            style={{ height: `${height}%` }}
          />
        );
      })}
    </div>
  );
}

function getMicStatusLabel(status: MicHealthStatus) {
  if (status === 'ok') return 'Input detected';
  if (status === 'muted') return 'Muted';
  if (status === 'silent') return 'No voice detected';
  if (status === 'permission-blocked') return 'Blocked';
  if (status === 'no-device') return 'No device';
  if (status === 'device-error') return 'Issue detected';
  return 'Ready';
}

function getMicStatusClass(status: MicHealthStatus) {
  if (status === 'ok') return 'text-emerald-300';
  if (status === 'muted' || status === 'silent') return 'text-amber-300';
  if (status === 'permission-blocked' || status === 'no-device' || status === 'device-error') return 'text-red-300';
  return 'text-slate-400';
}

function getSpeakerStatusLabel(status: SpeakerHealthStatus) {
  if (status === 'ok') return 'Playing';
  if (status === 'blocked') return 'Check output';
  if (status === 'unsupported-switching') return 'Default output';
  if (status === 'no-device') return 'No device';
  if (status === 'device-error') return 'Issue detected';
  return 'Ready';
}

function getSpeakerStatusClass(status: SpeakerHealthStatus) {
  if (status === 'ok') return 'text-emerald-300';
  if (status === 'blocked') return 'text-amber-300';
  if (status === 'no-device' || status === 'device-error') return 'text-red-300';
  return 'text-slate-400';
}

function getMicHealthMessage(status: MicHealthStatus) {
  if (status === 'muted') return 'Your microphone is muted. Unmute before answering.';
  if (status === 'silent') return 'No voice input is being detected. Check that the correct microphone is selected, the device is unmuted, and browser or Windows microphone access is allowed.';
  if (status === 'permission-blocked') return 'Microphone access is blocked. Open browser site settings from the address bar and allow Microphone for LadderStar.';
  if (status === 'no-device') return 'No microphone was found. Connect a microphone, confirm system privacy settings, then refresh device detection.';
  if (status === 'device-error') return 'The microphone is not available. Close other apps using it or select a different microphone.';
  return null;
}

function getSpeakerHealthMessage(status: SpeakerHealthStatus, error: string | null) {
  if (status === 'blocked') return 'Speaker output may be blocked or silent. Click the page once, check system volume, select a different output device, and confirm the browser tab is not muted.';
  if (status === 'no-device') return 'No speaker output device was found. Connect an output device or use the system default speaker.';
  if (status === 'device-error') return error || 'The selected speaker is not available. Choose a different output device or use the system default.';
  return null;
}
