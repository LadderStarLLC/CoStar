import { NextRequest, NextResponse } from 'next/server';
import { buildJobRequestState, JOBS_CACHE_SECONDS, loadProviderJobs } from '@/lib/jobProviders';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

function jsonResponse(body: Record<string, unknown>, init?: ResponseInit) {
  const response = NextResponse.json(body, init);
  response.headers.set('Cache-Control', `s-maxage=${JOBS_CACHE_SECONDS}, stale-while-revalidate=${JOBS_CACHE_SECONDS * 4}`);
  return response;
}

export async function GET(req: NextRequest) {
  try {
    const state = buildJobRequestState(new URL(req.url).searchParams, req.headers);
    return jsonResponse(await loadProviderJobs(state));
  } catch (error) {
    console.error('[api/jobs]', error);
    const message = error instanceof Error ? error.message : 'Unknown error';
    const status = message === 'No job provider API keys are configured.' ? 500 : 502;
    return jsonResponse({ error: message }, { status });
  }
}
