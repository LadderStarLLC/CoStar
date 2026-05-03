'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { Bookmark, CheckCircle2, ExternalLink, Mic, Users, Briefcase } from 'lucide-react';
import { serializeCareerjetJob } from '@/lib/careerjet';
import { useAuth } from '@/context/AuthContext';
import { JobData } from '@/lib/jobs';

type JobDetailActionsProps = {
  job: JobData;
  jobId: string;
};

export default function JobDetailActions({ job, jobId }: JobDetailActionsProps) {
  const router = useRouter();
  const { user } = useAuth();
  const [saved, setSaved] = useState(false);
  const [applied, setApplied] = useState(false);

  const handleApply = () => {
    if (job.application?.url) {
      window.open(job.application.url, '_blank');
    } else if (job.application?.email) {
      window.location.href = `mailto:${job.application.email}`;
    } else {
      setApplied(true);
    }
  };

  return (
    <>
      <div className="flex items-center gap-2">
        <button
          onClick={() => setSaved((current) => !current)}
          className={`h-11 w-11 rounded-xl border transition-colors ${
            saved
              ? 'bg-amber-500/20 border-amber-500/50 text-amber-400'
              : 'border-white/10 text-slate-400 hover:text-white hover:border-white/20'
          }`}
          aria-label={saved ? 'Unsave job' : 'Save job'}
        >
          <Bookmark className={`mx-auto h-5 w-5 ${saved ? 'fill-current' : ''}`} />
        </button>
        <button
          className="h-11 w-11 rounded-xl border border-white/10 text-slate-400 transition-colors hover:text-white hover:border-white/20"
          aria-label="Share job"
        >
          <ExternalLink className="mx-auto h-5 w-5" />
        </button>
      </div>

      <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6 sticky top-24 min-h-[294px]">
        {applied ? (
          <div className="text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-green-400 mx-auto mb-3" />
            <h3 className="text-white font-semibold mb-1">Application Submitted!</h3>
            <p className="text-slate-400 text-sm">Good luck with your application</p>
          </div>
        ) : (
          <>
            {job.application?.url ? (
              <a
                href={job.application.url}
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex min-h-12 items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 rounded-xl font-bold mb-4"
              >
                Apply on Company Site
                <ExternalLink className="w-4 h-4" />
              </a>
            ) : (
              <button
                onClick={handleApply}
                className="w-full flex min-h-12 items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 rounded-xl font-bold mb-4"
              >
                Apply Now
              </button>
            )}

            {user ? (
              <Link
                href={{
                  pathname: `/jobs/${jobId}/audition`,
                  query: { job: serializeCareerjetJob(job) },
                }}
                className="w-full flex min-h-12 items-center justify-center gap-2 px-6 py-3 mb-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl font-bold transition-colors border border-violet-500/30"
              >
                <Mic className="w-4 h-4" />
                Practice Audition
                <span className="ml-auto text-xs font-normal opacity-70">AI Interview</span>
              </Link>
            ) : (
              <button
                onClick={() => router.push('/sign-in')}
                className="w-full flex min-h-12 items-center justify-center gap-2 px-6 py-3 mb-3 bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-500 hover:to-purple-500 text-white rounded-xl font-bold transition-colors border border-violet-500/30"
              >
                <Mic className="w-4 h-4" />
                Sign in to practice
                <span className="ml-auto text-xs font-normal opacity-70">AI Interview</span>
              </button>
            )}

          </>
        )}

        <div className="mt-6 pt-6 border-t border-white/10 space-y-3">
          <div className="flex items-center gap-3 text-slate-400">
            <Users className="w-4 h-4" />
            <span className="text-sm">{job.metrics?.applications || 0} applicants</span>
          </div>
          {job.employment?.type && (
            <div className="flex items-center gap-3 text-slate-400">
              <Briefcase className="w-4 h-4" />
              <span className="text-sm capitalize">{job.employment.type.replace('-', ' ')}</span>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
