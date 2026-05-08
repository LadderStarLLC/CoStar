'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Radio, Send } from 'lucide-react';
import { RecordedInterviewConsent } from '@/components/screening/RecordedInterviewConsent';
import { getPreferredRecordingMimeType, getRecordingSupport } from '@/lib/recordingSupport';

type ScreeningData = {
  jobTitle: string;
  companyName: string;
  expiresAt: string | null;
  questions: string[];
  recording?: {
    enabled: boolean;
    maxBytes: number;
    consentTextVersion: string;
    consentTextSnapshot: string;
  };
};

type RecordingState = 'idle' | 'requesting' | 'recording' | 'stopped' | 'unsupported' | 'denied' | 'failed';

export default function ScreeningSessionClient({ token }: { token: string }) {
  const [data, setData] = useState<ScreeningData | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [consentChecked, setConsentChecked] = useState(false);
  const [consentId, setConsentId] = useState<string | null>(null);
  const [recordingId, setRecordingId] = useState<string | null>(null);
  const [recordingState, setRecordingState] = useState<RecordingState>('idle');
  const [recordingError, setRecordingError] = useState<string | null>(null);
  const [recordingStartedAt, setRecordingStartedAt] = useState<number | null>(null);
  const [previewStream, setPreviewStream] = useState<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const videoRef = useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch(`/api/screening/session?token=${encodeURIComponent(token)}`)
      .then(async (res) => {
        const payload = await res.json().catch(() => ({}));
        if (!res.ok) throw new Error(payload.error || 'Screening link is unavailable.');
        return payload as ScreeningData;
      })
      .then((payload) => {
        if (cancelled) return;
        setData(payload);
        setAnswers(payload.questions.map(() => ''));
      })
      .catch((err) => {
        if (!cancelled) setError(err instanceof Error ? err.message : 'Screening link is unavailable.');
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [token]);

  const canSubmit = useMemo(
    () => Boolean(
      participantName.trim() &&
      participantEmail.trim() &&
      answers.some((answer) => answer.trim()) &&
      (!data?.recording?.enabled || recordingState === 'recording' || recordingState === 'stopped')
    ),
    [participantName, participantEmail, answers, data?.recording?.enabled, recordingState],
  );

  useEffect(() => {
    if (videoRef.current && previewStream) {
      videoRef.current.srcObject = previewStream;
    }
  }, [previewStream]);

  useEffect(() => {
    const stop = () => stopLocalMedia();
    window.addEventListener('beforeunload', stop);
    return () => {
      window.removeEventListener('beforeunload', stop);
      stopLocalMedia();
    };
  }, []);

  async function startRecordedScreening() {
    if (!data?.recording?.enabled) return;
    setRecordingError(null);
    const support = getRecordingSupport();
    if (!support.supported) {
      setRecordingState('unsupported');
      setRecordingError('This browser does not support recorded screenings. Please use a current version of Chrome, Edge, Firefox, or Safari.');
      return;
    }
    if (!consentChecked) return;
    setRecordingState('requesting');
    try {
      const consentRes = await fetch('/api/screening/recording/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          participantName,
          participantEmail,
          consentGiven: true,
        }),
      });
      const consentPayload = await consentRes.json().catch(() => ({}));
      if (!consentRes.ok) throw new Error(consentPayload.error || 'Could not save recording consent.');

      const stream = await navigator.mediaDevices.getUserMedia({ audio: true, video: true });
      const mimeType = getPreferredRecordingMimeType();
      if (!mimeType) throw new Error('This browser cannot create a supported recording format.');

      const initRes = await fetch('/api/screening/recording/init', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          consentId: consentPayload.consentId,
          participantName,
          participantEmail,
          mimeType,
          recordingStartedAt: new Date().toISOString(),
        }),
      });
      const initPayload = await initRes.json().catch(() => ({}));
      if (!initRes.ok) throw new Error(initPayload.error || 'Could not initialize recording.');

      chunksRef.current = [];
      const recorder = new MediaRecorder(stream, { mimeType });
      recorder.ondataavailable = (event) => {
        if (event.data.size > 0) chunksRef.current.push(event.data);
      };
      recorder.onerror = () => {
        setRecordingState('failed');
        setRecordingError('The recorder reported an error. Please refresh the screening link and try again.');
      };
      recorderRef.current = recorder;
      streamRef.current = stream;
      setPreviewStream(stream);
      setConsentId(consentPayload.consentId);
      setRecordingId(initPayload.recordingId);
      setRecordingStartedAt(Date.now());
      recorder.start(5000);
      setRecordingState('recording');
    } catch (err) {
      stopLocalMedia();
      const message = err instanceof DOMException && (err.name === 'NotAllowedError' || err.name === 'PermissionDeniedError')
        ? 'Camera or microphone permission was denied. The recorded screening cannot proceed without permission.'
        : err instanceof Error ? err.message : 'Could not start the recorded screening.';
      setRecordingState(message.includes('denied') ? 'denied' : 'failed');
      setRecordingError(message);
    }
  }

  async function declineRecordedScreening() {
    if (data?.recording?.enabled) {
      await fetch('/api/screening/recording/consent', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, participantName, participantEmail, consentGiven: false }),
      }).catch(() => undefined);
    }
    setError('You declined recording, so this recorded screening will not proceed.');
  }

  async function stopAndUploadRecording(): Promise<string | null> {
    if (!data?.recording?.enabled) return null;
    if (recordingState === 'stopped' && recordingId) return recordingId;
    const recorder = recorderRef.current;
    if (!recorder || !recordingId || !consentId || !recordingStartedAt) {
      throw new Error('Recording has not started.');
    }
    const mimeType = recorder.mimeType || 'video/webm';
    const blob = await new Promise<Blob>((resolve) => {
      recorder.onstop = () => resolve(new Blob(chunksRef.current, { type: mimeType }));
      if (recorder.state !== 'inactive') recorder.stop();
      else resolve(new Blob(chunksRef.current, { type: mimeType }));
    });
    stopLocalMedia();
    setRecordingState('stopped');
    if (blob.size <= 0) throw new Error('Recording was empty. Please try again.');
    if (data.recording.maxBytes && blob.size > data.recording.maxBytes) {
      throw new Error('Recording is larger than the allowed upload size.');
    }
    const form = new FormData();
    form.append('token', token);
    form.append('consentId', consentId);
    form.append('recordingId', recordingId);
    form.append('durationSeconds', String(Math.round((Date.now() - recordingStartedAt) / 1000)));
    form.append('file', blob, 'screening-recording.webm');
    const uploadRes = await fetch('/api/screening/recording/upload', {
      method: 'POST',
      body: form,
    });
    const uploadPayload = await uploadRes.json().catch(() => ({}));
    if (!uploadRes.ok) throw new Error(uploadPayload.error || 'Recording upload failed.');
    return recordingId;
  }

  function stopLocalMedia() {
    recorderRef.current = null;
    streamRef.current?.getTracks().forEach((track) => track.stop());
    streamRef.current = null;
    setPreviewStream(null);
  }

  async function submit() {
    if (!data || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const completedRecordingId = await stopAndUploadRecording();
      const res = await fetch('/api/screening/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          participantName,
          participantEmail,
          answers: data.questions.map((question, index) => ({ question, answer: answers[index] ?? '' })),
          recordingId: completedRecordingId,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Could not submit screening.');
      setComplete(true);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not submit screening.');
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 text-white">
        <Loader2 className="h-6 w-6 animate-spin text-amber-300" />
      </main>
    );
  }

  if (error && !data) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-md rounded-xl border border-red-500/30 bg-red-500/10 p-6 text-red-200">
          <AlertCircle className="mb-3 h-6 w-6" />
          {error}
        </div>
      </main>
    );
  }

  if (complete) {
    return (
      <main className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-white">
        <div className="max-w-md rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-6 text-center">
          <CheckCircle2 className="mx-auto mb-3 h-8 w-8 text-emerald-300" />
          <h1 className="mb-2 text-xl font-bold">Screening submitted</h1>
          <p className="text-sm text-slate-300">The hiring team will review your completed screening report{data?.recording?.enabled ? ' and recording' : ''}.</p>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 px-4 py-8 text-white">
      <div className="mx-auto max-w-3xl">
        <div className="mb-6">
          <p className="text-sm font-semibold uppercase tracking-wide text-amber-300">LadderStar Screening</p>
          <h1 className="mt-2 text-3xl font-bold">{data?.jobTitle}</h1>
          {data?.companyName && <p className="mt-1 text-slate-400">{data.companyName}</p>}
        </div>

        {error && (
          <div className="mb-4 rounded-xl border border-red-500/30 bg-red-500/10 p-4 text-sm text-red-200">
            {error}
          </div>
        )}

        <section className="mb-6 rounded-xl border border-white/10 bg-slate-900 p-5">
          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Name</label>
              <input
                value={participantName}
                onChange={(e) => setParticipantName(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400"
              />
            </div>
            <div>
              <label className="mb-2 block text-sm font-medium text-slate-300">Email</label>
              <input
                type="email"
                value={participantEmail}
                onChange={(e) => setParticipantEmail(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400"
              />
            </div>
          </div>
        </section>

        {data?.recording?.enabled && (
          <section className="mb-6 rounded-xl border border-amber-400/30 bg-amber-400/10 p-5">
            {recordingState === 'recording' ? (
              <div className="space-y-4">
                <div className="inline-flex items-center gap-2 rounded-full border border-red-400/30 bg-red-500/10 px-3 py-1 text-sm font-semibold text-red-200">
                  <Radio className="h-4 w-4 animate-pulse" />
                  Recording
                </div>
                <video ref={videoRef} autoPlay muted playsInline className="aspect-video w-full max-w-md rounded-lg border border-white/10 bg-slate-950 object-cover" />
              </div>
            ) : (
              <RecordedInterviewConsent
                consentText={data.recording.consentTextSnapshot}
                checked={consentChecked}
                onCheckedChange={setConsentChecked}
                onContinue={startRecordedScreening}
                onDecline={declineRecordedScreening}
                disabled={!participantName.trim() || !participantEmail.trim()}
                loading={recordingState === 'requesting'}
                error={recordingError}
              />
            )}
          </section>
        )}

        {(!data?.recording?.enabled || recordingState === 'recording' || recordingState === 'stopped') && (
        <section className="space-y-4">
          {data?.questions.map((question, index) => (
            <div key={question} className="rounded-xl border border-white/10 bg-slate-900 p-5">
              <label className="mb-3 block font-semibold text-white">{index + 1}. {question}</label>
              <textarea
                value={answers[index] ?? ''}
                onChange={(e) => setAnswers((current) => current.map((answer, answerIndex) => answerIndex === index ? e.target.value : answer))}
                rows={5}
                className="w-full resize-none rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white outline-none focus:border-amber-400"
              />
            </div>
          ))}
        </section>
        )}

        <button
          onClick={submit}
          disabled={submitting || !canSubmit}
          className="mt-6 inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-4 font-bold text-slate-950 transition-colors hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {submitting ? <Loader2 className="h-5 w-5 animate-spin" /> : <Send className="h-5 w-5" />}
          Submit Screening
        </button>
      </div>
    </main>
  );
}
