'use client';

import { useState, useEffect, useCallback, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { JobFilters, SortOption, JobData } from '@/lib/jobs';
import { fetchCareerjetJobs } from '@/lib/careerjet';
import NavHeader from '@/components/NavHeader';
import JobCard from '@/components/JobCard';
import JobFiltersComponent from '@/components/JobFilters';
import { Briefcase, Loader2, AlertCircle } from 'lucide-react';

function JobsContent() {
  const { user, loading: authLoading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [jobs, setJobs] = useState<JobData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [filters, setFilters] = useState<JobFilters>({});
  const [sortBy, setSortBy] = useState<SortOption>('recent');
  const [hasMore, setHasMore] = useState(false);
  const [page, setPage] = useState(1);
  const [categories, setCategories] = useState<string[]>([]);
  const [locations, setLocations] = useState<{ city: string; country: string }[]>([]);
  const [tags, setTags] = useState<string[]>([]);
  const [sources, setSources] = useState<string[]>([]);

  useEffect(() => {
    const search = searchParams.get('search');
    const tag = searchParams.get('tag');
    const remote = searchParams.get('remote');

    const newFilters: JobFilters = {};

    if (search) newFilters.search = search;
    if (tag) newFilters.tags = [tag];
    if (remote) newFilters.remotePolicy = [remote];

    if (Object.keys(newFilters).length > 0) {
      setFilters((prev) => ({ ...prev, ...newFilters }));
    }
  }, [searchParams]);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in');
    }
  }, [user, authLoading, router]);

  const loadJobs = useCallback(async (nextPage = 1, append = false) => {
    if (!user) return;

    setIsLoading(true);
    setError(null);

    try {
      const result = await fetchCareerjetJobs(filters, sortBy, nextPage, 20);
      setJobs((prev) => (append ? [...prev, ...result.jobs] : result.jobs));
      setHasMore(result.hasMore);
      setPage(nextPage);
      setWarnings(result.warnings || []);

      const nextCategories = Array.from(new Set(result.jobs.map((job) => job.category).filter(Boolean) as string[]));
      const nextTags = Array.from(new Set(result.jobs.flatMap((job) => job.tags || []).filter(Boolean) as string[]));
      const nextSources = Array.from(new Set(result.jobs.map((job) => job.source).filter(Boolean) as string[]));
      const nextLocations = Array.from(
        new Map(
          result.jobs
            .filter((job) => job.location?.city || job.location?.country)
            .map((job) => {
              const city = job.location?.city || '';
              const country = job.location?.country || '';
              return [`${city}|${country}`, { city, country }];
            }),
        ).values(),
      );

      setCategories(nextCategories);
      setLocations(nextLocations);
      setTags(nextTags);
      setSources(nextSources);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load jobs. Please try again.');
      console.error('Error loading jobs:', err);
    } finally {
      setIsLoading(false);
    }
  }, [filters, sortBy, user]);

  useEffect(() => {
    if (user) {
      loadJobs(1, false);
    }
  }, [user, loadJobs]);

  useEffect(() => {
    if (user) {
      loadJobs(1, false);
    }
  }, [filters, sortBy, user, loadJobs]);

  const handleFiltersChange = (newFilters: JobFilters) => {
    setFilters(newFilters);
  };

  const handleSortChange = (newSort: SortOption) => {
    setSortBy(newSort);
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-[#1A1D20] flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-[#E5B536] animate-spin" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <div className="min-h-screen bg-[#1A1D20] text-[#F4F5F7]">
      <NavHeader />

      <div className="ladderstar-surface border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2">
            <div className="w-10 h-10 rounded-lg ladderstar-gold-gradient flex items-center justify-center shadow-[0_10px_26px_rgba(229,181,54,0.18)]">
              <Briefcase className="w-5 h-5 text-[#1A1D20]" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#F4F5F7]">LadderStar Job Board</h1>
          </div>
          <p className="text-[#F4F5F7]/68">
            Premium, scannable listings with focused filters for high-momentum career moves.
          </p>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-8">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex items-center gap-3 text-red-300 mb-6">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {warnings.length > 0 && (
          <div className="bg-[#E5B536]/10 border border-[#E5B536]/30 rounded-lg p-4 mb-6">
            <div className="flex items-center gap-3 text-[#E5B536] mb-2">
              <AlertCircle className="w-5 h-5" />
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
              categories={categories}
              locations={locations}
              tags={tags}
              sources={sources}
            />
          </aside>

          <div className="flex-1">
            {isLoading && jobs.length === 0 ? (
              <div className="flex items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-[#E5B536] animate-spin" />
              </div>
            ) : jobs.length === 0 ? (
              <div className="text-center py-20">
                <Briefcase className="w-12 h-12 text-[#F4F5F7]/25 mx-auto mb-4" />
                <h3 className="text-[#F4F5F7] font-semibold text-lg mb-2">No jobs found</h3>
                <p className="text-[#F4F5F7]/62">Try adjusting your filters or search query</p>
              </div>
            ) : (
              <div className="space-y-4">
                {jobs.map((job) => (
                  <JobCard key={job.jobId} job={job} />
                ))}
              </div>
            )}

            {hasMore && !isLoading && (
              <div className="mt-6 text-center">
                <button
                  onClick={() => loadJobs(page + 1, true)}
                  className="px-6 py-3 bg-[#262A2E] hover:border-[#5DC99B] border border-white/10 text-[#F4F5F7] rounded-lg font-semibold transition-colors"
                >
                  Load more jobs
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function JobsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#1A1D20] flex items-center justify-center">
          <Loader2 className="w-8 h-8 text-[#E5B536] animate-spin" />
        </div>
      }
    >
      <JobsContent />
    </Suspense>
  );
}
