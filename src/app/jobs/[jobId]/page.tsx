import Link from 'next/link';
import { AlertCircle, ArrowLeft, Briefcase, Clock, DollarSign, MapPin } from 'lucide-react';
import { deserializeCareerjetJob } from '@/lib/careerjet';
import { getAdminDb } from '@/lib/firebaseAdmin';
import { convertScrapedJobToJobData, JobData, ScrapedJobData } from '@/lib/jobs';
import JobDetailActions from './JobDetailActions';

export const dynamic = 'force-dynamic';

type JobDetailPageProps = {
  params: { jobId: string };
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function JobDetailPage({ params, searchParams }: JobDetailPageProps) {
  const job = await loadJob(params.jobId, searchParams);

  if (!job) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
        <div className="text-center">
          <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
          <h2 className="text-white text-xl font-semibold mb-2">Job not found</h2>
          <p className="text-slate-400 mb-6">This job may have been removed</p>
          <Link
            href="/jobs"
            className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-medium"
          >
            <ArrowLeft className="w-4 h-4" />
            Browse Jobs
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-slate-800/50 border-b border-white/10">
        <div className="max-w-5xl mx-auto px-4 py-6 min-h-[97px]">
          <Link href="/jobs" className="inline-flex items-center gap-2 text-slate-400 hover:text-white transition-colors">
            <ArrowLeft className="w-4 h-4" />
            Back to jobs
          </Link>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6 min-h-[214px]">
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0">
                  <h1 className="text-2xl font-bold text-white mb-2 break-words">{job.title}</h1>
                  <div className="flex items-center gap-2 text-slate-400 flex-wrap min-h-6">
                    <span className="font-medium text-amber-400">{job.companyName}</span>
                    {job.employment?.experienceLevel && (
                      <>
                        <span>-</span>
                        <span className="capitalize">{job.employment.experienceLevel}</span>
                      </>
                    )}
                  </div>
                  <div className="flex items-center gap-2 mt-2 min-h-6 flex-wrap">
                    {job.category && (
                      <span className="px-2 py-0.5 bg-blue-500/20 text-blue-400 border border-blue-500/30 rounded-full text-xs">
                        {job.category}
                      </span>
                    )}
                    {job.source && (
                      <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs">
                        {job.source}
                      </span>
                    )}
                  </div>
                </div>

                <div className="hidden h-11 w-[94px] shrink-0 sm:block" aria-hidden="true" />
              </div>

              <div className="flex flex-wrap items-center gap-4 mt-6 pt-6 border-t border-white/10 min-h-[53px]">
                {(job.location?.city || job.location?.country) && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <MapPin className="w-4 h-4 text-slate-500" />
                    <span>{[job.location.city, job.location.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}

                {job.location?.remotePolicy && (
                  <span className={`px-3 py-1 rounded-full text-sm font-medium border ${remoteBadgeClass(job.location.remotePolicy)}`}>
                    {job.location.remotePolicy === 'remote' ? 'Remote' : job.location.remotePolicy === 'hybrid' ? 'Hybrid' : 'On-site'}
                  </span>
                )}

                {job.employment?.type && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Briefcase className="w-4 h-4 text-slate-500" />
                    <span className="capitalize">{job.employment.type.replace('-', ' ')}</span>
                  </div>
                )}

                {formatDate(job.createdAt) && (
                  <div className="flex items-center gap-2 text-slate-300">
                    <Clock className="w-4 h-4 text-slate-500" />
                    <span>Posted {formatDate(job.createdAt)}</span>
                  </div>
                )}

                <div className="flex items-center gap-2 text-green-400 font-medium">
                  <DollarSign className="w-4 h-4" />
                  <span>{formatSalary(job)}</span>
                </div>
              </div>
            </div>

            <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6 min-h-[210px]">
              <h2 className="text-white font-semibold text-lg mb-4">About this role</h2>
              <div className="prose prose-invert max-w-none">
                <p className="text-slate-300 whitespace-pre-wrap break-words">{job.description}</p>
              </div>
            </div>

            {job.skills && ((job.skills.required?.length ?? 0) > 0 || (job.skills.preferred?.length ?? 0) > 0) && (
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                <h2 className="text-white font-semibold text-lg mb-4">Skills & Requirements</h2>
                {(job.skills.required?.length ?? 0) > 0 && (
                  <SkillGroup title="Required Skills" skills={job.skills.required || []} tone="required" />
                )}
                {(job.skills.preferred?.length ?? 0) > 0 && (
                  <SkillGroup title="Nice to Have" skills={job.skills.preferred || []} tone="preferred" />
                )}
              </div>
            )}

            {(job.tags?.length ?? 0) > 0 && (
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                <h2 className="text-white font-semibold text-lg mb-4">Tags</h2>
                <div className="flex flex-wrap gap-2">
                  {job.tags?.map((tag) => (
                    <Link
                      key={tag}
                      href={`/jobs?tag=${encodeURIComponent(tag)}`}
                      className="px-3 py-1.5 bg-slate-700/50 text-slate-300 border border-white/10 rounded-lg text-sm hover:border-amber-500/30 transition-colors"
                    >
                      {tag}
                    </Link>
                  ))}
                </div>
              </div>
            )}

            {job.screening?.stages && (job.screening.stages.length ?? 0) > 0 && (
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
                <h2 className="text-white font-semibold text-lg mb-4">Interview Process</h2>
                <div className="space-y-3">
                  {job.screening.stages.map((stage, index) => (
                    <div key={stage} className="flex items-center gap-3">
                      <div className="w-6 h-6 rounded-full bg-amber-500/20 text-amber-400 flex items-center justify-center text-sm font-medium">
                        {index + 1}
                      </div>
                      <span className="text-slate-300 capitalize">{stage.replace('_', ' ')}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-6">
            <div className="lg:sticky lg:top-6">
              <JobDetailActions job={job} jobId={params.jobId} />
            </div>

            {job.companyName && (
              <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6 min-h-[134px]">
                <h3 className="text-white font-semibold mb-4">About {job.companyName}</h3>
                {job.source && (
                  <p className="text-slate-400 text-sm mb-4">
                    <span className="px-2 py-0.5 bg-purple-500/20 text-purple-400 border border-purple-500/30 rounded-full text-xs">
                      {job.source}
                    </span>
                  </p>
                )}
                {job.location?.city && (
                  <div className="flex items-center gap-3 text-slate-400 text-sm mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{[job.location.city, job.location.country].filter(Boolean).join(', ')}</span>
                  </div>
                )}
              </div>
            )}

            <Link href="/jobs" className="block text-center text-amber-400 hover:text-amber-300 text-sm">
              Browse more jobs
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

async function loadJob(jobId: string, searchParams: JobDetailPageProps['searchParams']) {
  const payload = Array.isArray(searchParams.job) ? searchParams.job[0] : searchParams.job;
  const payloadJob = deserializeCareerjetJob(payload || null);
  if (payloadJob && payloadJob.jobId === jobId) return toSerializableJob(payloadJob);

  try {
    const snap = await getAdminDb().doc(`scrapedJobs/${jobId}`).get();
    if (!snap.exists) return null;
    return toSerializableJob(convertScrapedJobToJobData({ ...(snap.data() as ScrapedJobData), id: snap.id }));
  } catch (error) {
    console.warn('[jobs/detail] Unable to load job on server:', error);
    return null;
  }
}

function toSerializableJob(job: JobData): JobData {
  return JSON.parse(JSON.stringify(job));
}

function formatSalary(job: JobData) {
  if (!job.salary?.visible || (!job.salary?.min && !job.salary?.max)) return 'Salary not disclosed';

  const formatNumber = (num: number) => {
    if (num >= 1000) return `$${(num / 1000).toFixed(0)}k`;
    return `$${num}`;
  };

  const min = job.salary.min ? formatNumber(job.salary.min) : '';
  const max = job.salary.max ? formatNumber(job.salary.max) : '';

  return `${min}${min && max ? ' - ' : ''}${max} /${job.salary.period === 'yearly' ? 'yr' : job.salary.period === 'monthly' ? 'mo' : 'hr'}`;
}

function formatDate(value: unknown) {
  if (!value) return '';
  const date = new Date(value as string);
  if (Number.isNaN(date.getTime())) return '';
  return date.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  });
}

function remoteBadgeClass(remotePolicy: string) {
  if (remotePolicy === 'remote') return 'bg-green-500/20 text-green-400 border-green-500/30';
  if (remotePolicy === 'hybrid') return 'bg-blue-500/20 text-blue-400 border-blue-500/30';
  return 'bg-amber-500/20 text-amber-400 border-amber-500/30';
}

function SkillGroup({ title, skills, tone }: { title: string; skills: string[]; tone: 'required' | 'preferred' }) {
  return (
    <div className="mb-4 last:mb-0">
      <h3 className="text-slate-400 text-sm font-medium mb-2">{title}</h3>
      <div className="flex flex-wrap gap-2">
        {skills.map((skill) => (
          <span
            key={skill}
            className={
              tone === 'required'
                ? 'px-3 py-1.5 bg-amber-500/10 text-amber-400 border border-amber-500/30 rounded-lg text-sm'
                : 'px-3 py-1.5 bg-slate-700/50 text-slate-300 border border-white/10 rounded-lg text-sm'
            }
          >
            {skill}
          </span>
        ))}
      </div>
    </div>
  );
}
