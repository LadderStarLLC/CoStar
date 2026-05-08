'use client';

import { Loader2, ShieldCheck, Video } from 'lucide-react';

type Props = {
  consentText: string;
  checked: boolean;
  onCheckedChange: (checked: boolean) => void;
  onContinue: () => void;
  onDecline: () => void;
  disabled?: boolean;
  loading?: boolean;
  error?: string | null;
};

export function RecordedInterviewConsent({
  consentText,
  checked,
  onCheckedChange,
  onContinue,
  onDecline,
  disabled = false,
  loading = false,
  error,
}: Props) {
  return (
    <div className="space-y-4">
      <div className="mb-4 flex items-start gap-3">
        <ShieldCheck className="mt-1 h-5 w-5 flex-none text-amber-300" />
        <div>
          <h2 className="text-lg font-bold text-white">Recorded screening consent</h2>
          <p className="mt-2 text-sm leading-6 text-slate-200">{consentText}</p>
        </div>
      </div>
      <p className="text-sm text-slate-300">After you consent, your browser will ask for camera and microphone permission. The screening questions will unlock only after recording starts.</p>
      <label className="flex items-start gap-3 rounded-lg border border-white/10 bg-slate-950 p-3 text-sm text-slate-200">
        <input
          aria-label="Consent to audio/video recording"
          type="checkbox"
          checked={checked}
          onChange={(event) => onCheckedChange(event.target.checked)}
          className="mt-1 h-4 w-4 accent-amber-400"
        />
        <span>I understand and consent to audio/video recording for this business screening session.</span>
      </label>
      {error && (
        <div className="rounded-lg border border-red-500/30 bg-red-500/10 p-3 text-sm text-red-200">{error}</div>
      )}
      <div className="grid gap-3 sm:grid-cols-2">
        <button
          onClick={onContinue}
          disabled={loading || disabled || !checked}
          className="inline-flex items-center justify-center gap-2 rounded-xl bg-amber-400 px-4 py-3 font-bold text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : <Video className="h-5 w-5" />}
          Continue to recorded interview
        </button>
        <button
          onClick={onDecline}
          className="rounded-xl border border-white/10 px-4 py-3 font-semibold text-slate-200 hover:bg-white/10"
        >
          Decline / Exit
        </button>
      </div>
    </div>
  );
}
