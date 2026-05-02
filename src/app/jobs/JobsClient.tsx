'use client';

import { useCallback, useMemo, useState } from 'react';
import { AlertCircle, Briefcase, Loader2 } from 'lucide-react';
import JobCard from '@/components/JobCard';
import JobFiltersComponent from '@/components/JobFilters';
import { fetchCareerjetJobs } from '@/lib/careerjet';
import { JobData, JobFilters, SortOption } from '@/lib/jobs';

type JobsClientProps = {
  initialJobs: JobData[];
  initialFilters: JobFilters;
  initialSort: SortOption;
  initialHasMore: boolean;
  initialWarnings: string[];
};

function deriveFilterOptions(jobs: JobData[]) {
  return {
    categories: Array.from(new Set(jobs.map((job) => job.category).filter(Boolean) as string[])),
    tags: Array.from(new Set(jobs.flatMap((job) => job.tags || []).filter(Boolean) as string[])),
    sources: Array.from(new Set(jobs.map((job) => job.source).filter(Boolean) as string[])),
    locations: Array.from(
      new Map(
        jobs
          .filter((job) => job.location?.city || job.location?.country)
          .map((job) => {
            const city = job.location?.city || '';
            const country = job.location?.country || '';
            return [`${city}|${country}`, { city, country }];
          }),
      ).values(),
    ),
  };
}

export default function JobsClient({
  initialJobs,
  initialFilters,
  initialSort,
  initialHasMore,
  initialWarnings,
}: JobsClientProps) {
  const [jobs, setJobs] = useState<JobData[]>(initialJobs);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>(initialWarnings);
  const [filters, setFilters] = useState<JobFilters>(initialFilters);
  const [sortBy, setSortBy] = useState<SortOption>(initialSort);
  const [hasMore, setHasMore] = useState(initialHasMore);
  const [page, setPage] = useState(1);

  const filterOptions = useMemo(() => deriveFilterOptions(jobs), [jobs]);

  const loadJobs = useCallback(async (nextFilters: JobFilters, nextSort: SortOption, nextPage = 1, append = false) => {
    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchCareerjetJobs(nextFilters, nextSort, nextPage, 20);
      setJobs((prev) => (append ? [...prev, ...result.jobs] : result.jobs));
      setHasMore(result.hasMore);
      setPage(nextPage);
      setWarnings(result.warnings || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs. Please try again.');
      console.error('Error loading jobs:', err);
    } finally {
      setIsLoading(false);
    }
  }, []);

  const handleFiltersChange = (newFilters: JobFilters) => {
    setFilters(newFilters);
    loadJobs(newFilters, sortBy, 1, false);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
    loadJobs(filters, newSort, 1, false);
  };

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3 text-red-300 mb-6 min-h-[58px]">
          <AlertCircle className="w-5 h-5 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {warnings.length > 0 && (
        <div className="bg-[#E5B536]/10 border border-[#E5B536]/30 rounded-lg p-4 mb-6">
          <div className="flex items-center gap-3 text-[#E5B536] mb-2">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span className="font-semibold text-sm uppercase tracking-wider">Provider Warnings</span>
          </div>
          <ul className="list-disc list-inside text-sm text-[#E5B536]/80 space-y-1">
            {warnings.map((warning, i) => (
              <li key={i}>{warning}</li>
            ))}
          </ul>
        </div>
      )}

      <div className="flex flex-col lg:flex-row gap-8">
        <aside className="lg:w-72 flex-shrink-0">
          <JobFiltersComponent
            filters={filters}
            onFiltersChange={handleFiltersChange}
            sortBy={sortBy}
            onSortChange={handleSortChange}
            categories={filterOptions.categories}
            locations={filterOptions.locations}
            tags={filterOptions.tags}
            sources={filterOptions.sources}
          />
        </aside>

        <div className="flex-1 min-w-0">
          {isLoading && jobs.length === 0 ? (
            <JobListSkeleton />
          ) : jobs.length === 0 ? (
            <div className="text-center py-20 min-h-[280px]">
              <Briefcase className="w-12 h-12 text-[#F4F5F7]/25 mx-auto mb-4" />
              <h3 className="text-[#F4F5F7] font-semibold text-lg mb-2">No jobs found</h3>
              <p className="text-[#F4F5F7]/62">Try adjusting your filters or search query</p>
            </div>
          ) : (
            <div className={isLoading ? 'space-y-4 opacity-70' : 'space-y-4'}>
              {jobs.map((job) => (
                <JobCard key={job.jobId} job={job} />
              ))}
            </div>
          )}

          {hasMore && (
            <div className="mt-6 text-center min-h-[48px]">
              <button
                onClick={() => loadJobs(filters, sortBy, page + 1, true)}
                disabled={isLoading}
                className="inline-flex min-w-36 items-center justify-center gap-2 px-6 py-3 bg-[#262A2E] hover:border-[#5DC99B] border border-white/10 text-[#F4F5F7] rounded-lg font-semibold transition-colors disabled:opacity-60"
              >
                {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
                Load more jobs
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function JobListSkeleton() {
  return (
    <div className="space-y-4" aria-hidden="true">
      {Array.from({ length: 4 }).map((_, index) => (
        <div key={index} className="min-h-[222px] rounded-lg border border-white/10 bg-[#262A2E] p-5">
          <div className="flex gap-4">
            <div className="h-12 w-12 shrink-0 rounded-lg bg-white/10" />
            <div className="flex-1 space-y-3">
              <div className="h-5 w-2/3 rounded bg-white/10" />
              <div className="h-4 w-1/3 rounded bg-white/10" />
              <div className="h-4 w-full rounded bg-white/10" />
              <div className="h-4 w-5/6 rounded bg-white/10" />
              <div className="flex gap-2 pt-2">
                <div className="h-7 w-20 rounded bg-white/10" />
                <div className="h-7 w-24 rounded bg-white/10" />
              </div>
            </div>
          </div>
        </div>
      ))}
    </div>
  );
}
