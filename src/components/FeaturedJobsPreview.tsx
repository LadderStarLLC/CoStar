'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { Briefcase, ExternalLink, Loader2, MapPin, Search, SlidersHorizontal } from 'lucide-react';
import { JobData } from '@/lib/jobs';
import { fetchCareerjetJobs } from '@/lib/careerjet';
import { serializeCareerjetJob } from '@/lib/careerjet';

function formatSalary(job: JobData) {
  if (!job.salary?.visible || (!job.salary?.min && !job.salary?.max)) return 'Compensation varies';

  const currency = job.salary.currency || 'USD';
  const symbol = currency === 'USD' || currency === '$' ? '$' : `${currency} `;
  const formatNumber = (value: number) => {
    if (value >= 1000) return `${symbol}${Math.round(value / 1000)}k`;
    return `${symbol}${value}`;
  };

  const min = job.salary.min ? formatNumber(job.salary.min) : '';
  const max = job.salary.max ? formatNumber(job.salary.max) : '';
  const period = job.salary.period === 'monthly' ? '/mo' : job.salary.period === 'hourly' ? '/hr' : '/yr';

  return `${min}${min && max ? ' - ' : ''}${max}${period}`;
}

function locationLabel(job: JobData) {
  const location = [job.location?.city, job.location?.country].filter(Boolean).join(', ');
  return location || job.location?.remotePolicy || 'Flexible location';
}

function roleTags(job: JobData) {
  return [
    job.location?.remotePolicy,
    job.employment?.experienceLevel,
    job.employment?.type,
    ...(job.tags || []),
  ]
    .filter(Boolean)
    .slice(0, 3) as string[];
}

export default function FeaturedJobsPreview() {
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    async function loadFeaturedJobs() {
      setIsLoading(true);
      setError(null);

      try {
        const result = await fetchCareerjetJobs(
          { search: 'senior executive director principal AI product engineering strategy' },
          'salary_high',
          1,
          12,
        );

        if (!isMounted) return;

        const lucrativeFirst = [...result.jobs].sort((a, b) => {
          const bSalary = b.salary?.max || b.salary?.min || 0;
          const aSalary = a.salary?.max || a.salary?.min || 0;
          return bSalary - aSalary;
        });

        setJobs(lucrativeFirst.slice(0, 3));
      } catch (err) {
        if (!isMounted) return;
        setError(err instanceof Error ? err.message : 'Unable to load featured jobs');
      } finally {
        if (isMounted) setIsLoading(false);
      }
    }

    loadFeaturedJobs();

    return () => {
      isMounted = false;
    };
  }, []);

  const searchHref = useMemo(
    () => `/jobs?search=${encodeURIComponent('senior executive director principal AI product engineering strategy')}`,
    [],
  );

  return (
    <div className="rounded-lg border border-white/10 bg-[#262A2E]/90 p-4 shadow-2xl shadow-black/30">
      <div className="rounded-lg border border-[#5DC99B]/20 bg-[#1A1D20] p-4">
        <div className="grid sm:grid-cols-[1fr_auto] gap-3">
          <Link href={searchHref} className="relative block">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-[#5DC99B]" />
            <div className="rounded-lg border border-[#5DC99B]/45 bg-[#262A2E] py-3 pl-10 pr-4 text-[#F4F5F7]/86">
              senior, AI, product, strategy
            </div>
          </Link>
          <Link
            href={searchHref}
            className="inline-flex items-center justify-center gap-2 rounded-lg ladderstar-action px-5 py-3 font-bold text-[#1A1D20]"
          >
            <SlidersHorizontal className="w-4 h-4" />
            View roles
          </Link>
        </div>
      </div>

      <div className="mt-4 space-y-3">
        {isLoading && (
          <div className="flex items-center justify-center rounded-lg border border-white/10 bg-[#1A1D20]/70 p-10 text-[#F4F5F7]/62">
            <Loader2 className="mr-2 h-5 w-5 animate-spin text-[#E5B536]" />
            Loading curated roles...
          </div>
        )}

        {!isLoading && error && (
          <div className="rounded-lg border border-[#E5B536]/30 bg-[#E5B536]/10 p-5 text-sm text-[#E5B536]">
            Curated roles are temporarily unavailable. Browse the job board to retry.
          </div>
        )}

        {!isLoading && !error && jobs.length === 0 && (
          <div className="rounded-lg border border-white/10 bg-[#1A1D20]/70 p-5 text-sm text-[#F4F5F7]/62">
            No featured roles matched yet. Browse the job board for current listings.
          </div>
        )}

        {!isLoading &&
          !error &&
          jobs.map((job, index) => {
            const jobHref = job.jobId
              ? {
                  pathname: `/jobs/${job.jobId}`,
                  query: { job: serializeCareerjetJob(job) },
                }
              : '/jobs';

            return (
              <Link
                key={job.jobId || `${job.title}-${job.companyName}`}
                href={jobHref}
                className={`block rounded-lg border p-4 transition hover:border-[#5DC99B]/55 ${
                  index === 0 ? 'border-[#E5B536]/45 ladderstar-ascent-gradient' : 'border-white/10 bg-[#1A1D20]/70'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0">
                    <h2 className="truncate font-bold text-[#F4F5F7]">{job.title || 'Featured role'}</h2>
                    <p className="mt-1 truncate text-sm text-[#F4F5F7]/65">{job.companyName || 'Hiring company'}</p>
                  </div>
                  <div className="rounded-lg ladderstar-gold-gradient p-2">
                    <Briefcase className="w-4 h-4 text-[#1A1D20]" />
                  </div>
                </div>
                <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-[#F4F5F7]/65">
                  <span className="inline-flex items-center gap-1">
                    <MapPin className="w-4 h-4 text-[#5DC99B]" />
                    {locationLabel(job)}
                  </span>
                  <span className="font-semibold text-[#E5B536]">{formatSalary(job)}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  {roleTags(job).map((tag) => (
                    <span
                      key={tag}
                      className="rounded-full border border-[#5DC99B]/30 bg-[#5DC99B]/10 px-2.5 py-1 text-xs font-semibold capitalize text-[#5DC99B]"
                    >
                      {tag.replace('-', ' ')}
                    </span>
                  ))}
                  <span className="inline-flex items-center gap-1 rounded-full border border-[#E5B536]/30 bg-[#E5B536]/10 px-2.5 py-1 text-xs font-semibold text-[#E5B536]">
                    External listing
                    <ExternalLink className="h-3 w-3" />
                  </span>
                </div>
              </Link>
            );
          })}
      </div>
    </div>
  );
}
