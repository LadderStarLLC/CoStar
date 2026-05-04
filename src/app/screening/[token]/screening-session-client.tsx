'use client';

import { useEffect, useMemo, useState } from 'react';
import { AlertCircle, CheckCircle2, Loader2, Send } from 'lucide-react';

type ScreeningData = {
  jobTitle: string;
  companyName: string;
  expiresAt: string | null;
  questions: string[];
};

export default function ScreeningSessionClient({ token }: { token: string }) {
  const [data, setData] = useState<ScreeningData | null>(null);
  const [answers, setAnswers] = useState<string[]>([]);
  const [participantName, setParticipantName] = useState('');
  const [participantEmail, setParticipantEmail] = useState('');
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [complete, setComplete] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    () => Boolean(participantName.trim() && participantEmail.trim() && answers.some((answer) => answer.trim())),
    [participantName, participantEmail, answers],
  );

  async function submit() {
    if (!data || !canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch('/api/screening/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token,
          participantName,
          participantEmail,
          answers: data.questions.map((question, index) => ({ question, answer: answers[index] ?? '' })),
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
          <p className="text-sm text-slate-300">The hiring team will review your completed screening report.</p>
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
