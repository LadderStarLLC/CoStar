import { AlertCircle, Briefcase } from 'lucide-react';
import NavHeader from '@/components/NavHeader';
import { buildJobRequestStateFromServerSearchParams, loadProviderJobs } from '@/lib/jobProviders';
import JobsClient from './JobsClient';

export const dynamic = 'force-dynamic';

type JobsPageProps = {
  searchParams: Record<string, string | string[] | undefined>;
};

export default async function JobsPage({ searchParams }: JobsPageProps) {
  const state = await buildJobRequestStateFromServerSearchParams(searchParams);
  const initialData = await loadProviderJobs(state).catch((error) => ({
    jobs: [],
    total: 0,
    page: 1,
    pages: 0,
    hasMore: false,
    source: '',
    warnings: [],
    message: null,
    initialError: error instanceof Error ? error.message : 'Failed to load jobs. Please try again.',
  }));

  return (
    <div className="min-h-screen bg-[#1A1D20] text-[#F4F5F7]">
      <NavHeader />

      <div className="ladderstar-surface border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center gap-3 mb-2 min-h-10">
            <div className="w-10 h-10 shrink-0 rounded-lg ladderstar-gold-gradient flex items-center justify-center shadow-[0_10px_26px_rgba(229,181,54,0.18)]">
              <Briefcase className="w-5 h-5 text-[#1A1D20]" />
            </div>
            <h1 className="text-2xl font-black tracking-tight text-[#F4F5F7]">LadderStar Job Board</h1>
          </div>
          <p className="min-h-6 text-[#F4F5F7]/68">
            Premium, scannable listings with focused filters for high-momentum career moves.
          </p>
        </div>
      </div>

      {'initialError' in initialData && initialData.initialError && (
        <div className="mx-auto max-w-7xl px-4 pt-8">
          <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 flex min-h-[58px] items-center gap-3 text-red-300">
            <AlertCircle className="w-5 h-5 shrink-0" />
            <span>{initialData.initialError}</span>
          </div>
        </div>
      )}

      <JobsClient
        initialJobs={initialData.jobs}
        initialFilters={state.filters}
        initialSort={state.sort}
        initialHasMore={initialData.hasMore}
        initialWarnings={initialData.warnings}
      />
    </div>
  );
}
