import { headers } from 'next/headers';
import { JobData, JobFilters, SortOption } from './jobs';

export const JOBS_CACHE_SECONDS = 60 * 15;

type RemotePolicy = 'remote' | 'hybrid' | 'onsite' | 'flexible' | undefined;
type EmploymentType = 'full-time' | 'part-time' | 'contract' | 'internship' | 'temporary' | 'freelance' | undefined;
type ExperienceLevel = 'entry' | 'mid' | 'senior' | 'lead' | 'director' | 'executive' | undefined;
type SalaryPeriod = 'hourly' | 'monthly' | 'yearly' | undefined;
type ProviderName = 'careerjet' | 'jooble';

type CareerjetApiJob = {
  title?: string;
  company?: string;
  date?: string;
  description?: string;
  locations?: string;
  salary?: string;
  salary_currency_code?: string;
  salary_max?: number;
  salary_min?: number;
  salary_type?: 'Y' | 'M' | 'W' | 'D' | 'H';
  site?: string;
  url?: string;
};

type CareerjetApiResponse = {
  type?: string;
  hits?: number;
  message?: string;
  pages?: number;
  jobs?: CareerjetApiJob[];
  locations?: string[];
};

type JoobleApiJob = {
  title?: string;
  company?: string;
  location?: string;
  snippet?: string;
  salary?: string;
  type?: string;
  link?: string;
  source?: string;
  updated?: string;
};

type JoobleApiResponse = {
  totalCount?: number;
  jobs?: JoobleApiJob[];
};

type ProviderResult = {
  provider: ProviderName;
  jobs: JobData[];
  total: number;
  pages: number;
  message?: string | null;
  locationChoices?: string[];
};

export type JobProviderRequestState = {
  search: string;
  location: string;
  source: string;
  sort: SortOption;
  page: number;
  pageSize: number;
  filters: JobFilters;
  userIp: string;
  userAgent: string;
  referer: string;
};

export type JobProviderResponse = {
  jobs: JobData[];
  total: number;
  page: number;
  pages: number;
  hasMore: boolean;
  source: string;
  warnings: string[];
  message: string | null;
  locationChoices?: string[];
  cachedForSeconds?: number;
};

function getAuthHeader(apiKey: string) {
  return `Basic ${Buffer.from(`${apiKey}:`).toString('base64')}`;
}

function hashString(input: string) {
  let hash = 0;
  for (let i = 0; i < input.length; i += 1) {
    hash = (hash << 5) - hash + input.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash).toString(36);
}

function inferRemotePolicyFromText(text: string): RemotePolicy {
  const haystack = text.toLowerCase();
  if (haystack.includes('hybrid')) return 'hybrid';
  if (haystack.includes('remote')) return 'remote';
  if (haystack.includes('on-site') || haystack.includes('onsite')) return 'onsite';
  return undefined;
}

function inferEmploymentTypeFromText(text: string): EmploymentType {
  const haystack = text.toLowerCase();
  if (haystack.includes('intern')) return 'internship';
  if (haystack.includes('contract')) return 'contract';
  if (haystack.includes('temporary') || haystack.includes('temp ')) return 'temporary';
  if (haystack.includes('part-time') || haystack.includes('part time')) return 'part-time';
  if (haystack.includes('freelance')) return 'freelance';
  return 'full-time';
}

function inferExperienceLevelFromText(text: string): ExperienceLevel {
  const haystack = text.toLowerCase();
  if (haystack.includes('director')) return 'director';
  if (haystack.includes('executive') || haystack.includes('chief ')) return 'executive';
  if (haystack.includes('lead') || haystack.includes('principal')) return 'lead';
  if (haystack.includes('senior') || haystack.includes('sr.')) return 'senior';
  if (haystack.includes('junior') || haystack.includes('entry')) return 'entry';
  return 'mid';
}

function salaryPeriodFromCode(code?: CareerjetApiJob['salary_type']): SalaryPeriod {
  switch (code) {
    case 'M':
      return 'monthly';
    case 'H':
      return 'hourly';
    default:
      return 'yearly';
  }
}

function truncateDescription(text?: string, maxLength = 180) {
  if (!text) return '';
  const normalized = text.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  if (normalized.length <= maxLength) return normalized;
  return `${normalized.slice(0, maxLength).trim()}...`;
}

function parseLocation(raw?: string) {
  const parts = (raw || '').split(',').map((part) => part.trim()).filter(Boolean);
  return {
    city: parts[0],
    country: parts.length > 1 ? parts[parts.length - 1] : parts[0],
  };
}

function parseSalaryString(text?: string) {
  if (!text) return undefined;
  const matches = text.match(/\d[\d,.]*/g)?.map((value) => Number(value.replace(/,/g, ''))).filter((value) => Number.isFinite(value));
  const currencyMatch = text.match(/USD|EUR|GBP|CAD|AUD|INR|\$|€/i)?.[0];
  if (!matches?.length) {
    return {
      currency: currencyMatch,
      visible: true,
    };
  }

  return {
    min: matches[0],
    max: matches[1] || matches[0],
    currency: currencyMatch,
    visible: true,
  };
}

function validProviderDate(value?: string) {
  if (!value) return undefined;
  const date = new Date(value);
  return Number.isNaN(date.getTime()) ? undefined : date.toISOString();
}

function mapCareerjetJob(job: CareerjetApiJob): JobData {
  const location = parseLocation(job.locations);
  const text = `${job.title || ''} ${job.description || ''} ${job.locations || ''}`;
  const createdAt = validProviderDate(job.date);
  const jobId = hashString(`careerjet|${job.url || ''}|${job.title || ''}|${job.company || ''}`);

  return {
    jobId,
    title: job.title,
    companyName: job.company,
    description: truncateDescription(job.description, 4000),
    shortDescription: truncateDescription(job.description, 180),
    location: {
      city: location.city,
      country: location.country,
      remotePolicy: inferRemotePolicyFromText(text),
    },
    salary: job.salary_min || job.salary_max || job.salary
      ? {
          min: job.salary_min,
          max: job.salary_max,
          currency: job.salary_currency_code || undefined,
          period: salaryPeriodFromCode(job.salary_type),
          visible: true,
        }
      : undefined,
    employment: {
      type: inferEmploymentTypeFromText(text),
      experienceLevel: inferExperienceLevelFromText(text),
    },
    application: {
      method: 'external',
      url: job.url,
    },
    source: 'Curated external listing',
    url: job.url,
    createdAt,
    category: 'External role',
    tags: [inferEmploymentTypeFromText(text), inferExperienceLevelFromText(text), inferRemotePolicyFromText(text)].filter(Boolean) as string[],
  };
}

function mapJoobleJob(job: JoobleApiJob): JobData {
  const text = `${job.title || ''} ${job.snippet || ''} ${job.location || ''} ${job.type || ''}`;
  const location = parseLocation(job.location);
  const salary = parseSalaryString(job.salary);
  const createdAt = validProviderDate(job.updated);
  const jobId = hashString(`jooble|${job.link || ''}|${job.title || ''}|${job.company || ''}`);

  return {
    jobId,
    title: job.title,
    companyName: job.company,
    description: truncateDescription(job.snippet, 4000),
    shortDescription: truncateDescription(job.snippet, 180),
    location: {
      city: location.city,
      country: location.country,
      remotePolicy: inferRemotePolicyFromText(text),
    },
    salary: salary ? { ...salary, period: undefined } : undefined,
    employment: {
      type: inferEmploymentTypeFromText(text),
      experienceLevel: inferExperienceLevelFromText(text),
    },
    application: {
      method: 'external',
      url: job.link,
    },
    source: 'Curated external listing',
    url: job.link,
    createdAt,
    category: 'External role',
    tags: [inferEmploymentTypeFromText(text), inferExperienceLevelFromText(text), inferRemotePolicyFromText(text)].filter(Boolean) as string[],
  };
}

function applyLocalFilters(jobs: JobData[], filters: JobFilters, sort: SortOption) {
  let filtered = jobs;

  if (filters.remotePolicy?.length) {
    filtered = filtered.filter((job) => job.location?.remotePolicy && filters.remotePolicy?.includes(job.location.remotePolicy));
  }

  if (filters.employmentType?.length) {
    filtered = filtered.filter((job) => job.employment?.type && filters.employmentType?.includes(job.employment.type));
  }

  if (filters.experienceLevel?.length) {
    filtered = filtered.filter((job) => job.employment?.experienceLevel && filters.experienceLevel?.includes(job.employment.experienceLevel));
  }

  if (filters.salaryMin) {
    const salaryMin = filters.salaryMin;
    filtered = filtered.filter((job) => (job.salary?.max || job.salary?.min || 0) >= salaryMin);
  }

  if (filters.salaryMax) {
    const salaryMax = filters.salaryMax;
    filtered = filtered.filter((job) => (job.salary?.min || job.salary?.max || 0) <= salaryMax);
  }

  if (filters.datePosted && filters.datePosted !== 'any') {
    const maxAgeDays = filters.datePosted === '24h' ? 1 : filters.datePosted === 'week' ? 7 : 30;
    filtered = filtered.filter((job) => {
      if (!job.createdAt) return false;
      const createdAt = new Date(job.createdAt as string);
      if (Number.isNaN(createdAt.getTime())) return false;
      return Date.now() - createdAt.getTime() <= maxAgeDays * 24 * 60 * 60 * 1000;
    });
  }

  if (filters.source?.length) {
    filtered = filtered.filter((job) => job.source && filters.source?.includes(job.source));
  }

  switch (sort) {
    case 'salary_high':
      filtered = [...filtered].sort((a, b) => (b.salary?.max || b.salary?.min || 0) - (a.salary?.max || a.salary?.min || 0));
      break;
    case 'salary_low':
      filtered = [...filtered].sort((a, b) => (a.salary?.min || a.salary?.max || Number.MAX_SAFE_INTEGER) - (b.salary?.min || b.salary?.max || Number.MAX_SAFE_INTEGER));
      break;
    case 'company_az':
      filtered = [...filtered].sort((a, b) => (a.companyName || '').localeCompare(b.companyName || ''));
      break;
    case 'recent':
    default:
      filtered = [...filtered].sort((a, b) => new Date(b.createdAt as string || 0).getTime() - new Date(a.createdAt as string || 0).getTime());
      break;
  }

  return filtered;
}

function dedupeJobs(jobs: JobData[]) {
  const seen = new Set<string>();
  const deduped: JobData[] = [];

  for (const job of jobs) {
    const title = (job.title || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const company = (job.companyName || '').toLowerCase().replace(/\s+/g, ' ').trim();
    const city = (job.location?.city || '').toLowerCase().trim();
    const country = (job.location?.country || '').toLowerCase().trim();
    const url = (job.url || job.application?.url || '').toLowerCase().trim();
    const key = title && company ? `${title}|${company}|${city}|${country}` : url;
    if (!key) continue;
    if (seen.has(key)) continue;
    seen.add(key);
    deduped.push(job);
  }

  return deduped;
}

export function buildJobRequestState(
  searchParams: URLSearchParams,
  requestHeaders?: Headers,
): JobProviderRequestState {
  const search = searchParams.get('search') || '';
  const location = searchParams.get('location') || '';
  const source = (searchParams.get('source') || 'all').toLowerCase();
  const sort = (searchParams.get('sort') as SortOption) || 'recent';
  const page = Math.min(Math.max(Number(searchParams.get('page') || '1'), 1), 10);
  const pageSize = Math.min(Math.max(Number(searchParams.get('pageSize') || '20'), 1), 100);
  const employmentType = searchParams.get('employmentType')?.split(',').filter(Boolean) || [];
  const remotePolicy = searchParams.get('remotePolicy')?.split(',').filter(Boolean) || [];
  const remote = searchParams.get('remote');
  const experienceLevel = searchParams.get('experienceLevel')?.split(',').filter(Boolean) || [];
  const salaryMin = Number(searchParams.get('salaryMin') || '') || undefined;
  const salaryMax = Number(searchParams.get('salaryMax') || '') || undefined;
  const datePosted = (searchParams.get('datePosted') as JobFilters['datePosted']) || undefined;
  const tags = searchParams.get('tags')?.split(',').filter(Boolean) || [];
  const tag = searchParams.get('tag');
  const sourceFilter = searchParams.get('sourceFilter')?.split(',').filter(Boolean) || [];

  const filters: JobFilters = {
    search: search || undefined,
    remotePolicy: remotePolicy.length ? remotePolicy : remote ? [remote] : undefined,
    employmentType: employmentType.length ? employmentType : undefined,
    experienceLevel: experienceLevel.length ? experienceLevel : undefined,
    salaryMin,
    salaryMax,
    datePosted,
    tags: tags.length ? tags : tag ? [tag] : undefined,
    source: sourceFilter.length ? sourceFilter : undefined,
  };

  const userIp = requestHeaders?.get('x-forwarded-for')?.split(',')[0]?.trim() || '127.0.0.1';
  const userAgent = requestHeaders?.get('user-agent') || 'CoStar/1.0';
  const referer = requestHeaders?.get('referer') || 'https://costar.app/jobs';

  return { search, location, source, sort, page, pageSize, filters, userIp, userAgent, referer };
}

export async function buildJobRequestStateFromServerSearchParams(
  searchParams: Record<string, string | string[] | undefined>,
) {
  const params = new URLSearchParams();
  for (const [key, value] of Object.entries(searchParams)) {
    if (Array.isArray(value)) {
      params.set(key, value.join(','));
    } else if (value) {
      params.set(key, value);
    }
  }

  return buildJobRequestState(params, headers());
}

async function fetchCareerjet(state: JobProviderRequestState, apiKey: string): Promise<ProviderResult> {
  const apiParams = new URLSearchParams({
    locale_code: 'en_US',
    keywords: state.search || 'jobs',
    page: String(state.page),
    page_size: String(state.pageSize),
    sort: state.sort === 'recent' ? 'date' : state.sort === 'salary_high' ? 'salary' : 'relevance',
    user_ip: state.userIp,
    user_agent: state.userAgent,
  });

  if (state.location) apiParams.set('location', state.location);
  if (state.filters.employmentType?.includes('part-time')) apiParams.set('work_hours', 'p');
  else if (state.filters.employmentType?.includes('full-time')) apiParams.set('work_hours', 'f');
  else if (state.filters.employmentType?.includes('contract')) apiParams.set('contract_type', 'c');
  else if (state.filters.employmentType?.includes('temporary')) apiParams.set('contract_type', 't');
  else if (state.filters.employmentType?.includes('internship')) apiParams.set('contract_type', 'i');

  const proxyUrl = process.env.JOB_BOARD_PROXY_URL;
  const fetchUrl = proxyUrl
    ? `${proxyUrl.replace(/\/$/, '')}/careerjet/v4/query?${apiParams.toString()}`
    : `https://search.api.careerjet.net/v4/query?${apiParams.toString()}`;

  const response = await fetch(fetchUrl, {
    headers: {
      Authorization: getAuthHeader(apiKey),
      Accept: 'application/json',
      Referer: state.referer,
      'User-Agent': state.userAgent,
      'X-Forwarded-For': state.userIp,
    },
    next: { revalidate: JOBS_CACHE_SECONDS },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(`Careerjet request failed (${response.status}): ${errorBody.message || errorBody.error || 'Unknown error'}`);
  }

  const data = (await response.json()) as CareerjetApiResponse & { type?: string; message?: string };
  if (data.type === 'ERROR') {
    throw new Error(`Careerjet API error: ${data.message || 'Unknown provider error'}`);
  }

  if (data.type === 'LOCATIONS') {
    return {
      provider: 'careerjet',
      jobs: [],
      total: 0,
      pages: 0,
      message: data.message || null,
      locationChoices: data.locations || [],
    };
  }

  return {
    provider: 'careerjet',
    jobs: (data.jobs || []).map(mapCareerjetJob),
    total: data.hits || 0,
    pages: data.pages || 0,
    message: data.message || null,
  };
}

async function fetchJooble(state: JobProviderRequestState, apiKey: string): Promise<ProviderResult> {
  const proxyUrl = process.env.JOB_BOARD_PROXY_URL;
  const fetchUrl = proxyUrl
    ? `${proxyUrl.replace(/\/$/, '')}/jooble/api/${apiKey}`
    : `https://jooble.org/api/${apiKey}`;

  const response = await fetch(fetchUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      Referer: state.referer,
      'User-Agent': state.userAgent,
      'X-Forwarded-For': state.userIp,
    },
    body: JSON.stringify({
      keywords: state.search || 'jobs',
      location: state.location || '',
      page: state.page,
    }),
    next: { revalidate: JOBS_CACHE_SECONDS },
  });

  if (!response.ok) {
    const errorBody = await response.json().catch(() => ({}));
    throw new Error(`Jooble request failed (${response.status}): ${errorBody.message || errorBody.error || 'Unknown error'}`);
  }

  const data = (await response.json()) as JoobleApiResponse;
  return {
    provider: 'jooble',
    jobs: (data.jobs || []).map(mapJoobleJob),
    total: data.totalCount || 0,
    pages: Math.ceil((data.totalCount || 0) / state.pageSize),
    message: null,
  };
}

export async function loadProviderJobs(state: JobProviderRequestState): Promise<JobProviderResponse> {
  const careerjetKey = process.env.CAREERJET_API_KEY;
  const joobleKey = process.env.JOOBLE_API_KEY;
  const providers: Promise<ProviderResult>[] = [];

  if ((state.source === 'all' || state.source === 'careerjet') && careerjetKey) {
    providers.push(fetchCareerjet(state, careerjetKey));
  }

  if ((state.source === 'all' || state.source === 'jooble') && joobleKey) {
    providers.push(fetchJooble(state, joobleKey));
  }

  if (providers.length === 0) {
    throw new Error('No job provider API keys are configured.');
  }

  const settled = await Promise.allSettled(providers);
  const successes = settled.filter((result): result is PromiseFulfilledResult<ProviderResult> => result.status === 'fulfilled').map((result) => result.value);
  const failures = settled.filter((result): result is PromiseRejectedResult => result.status === 'rejected');

  if (successes.length === 0) {
    throw new Error(failures.map((failure) => failure.reason?.message || 'Provider failed').join(' | '));
  }

  const locationChoices = successes.flatMap((result) => result.locationChoices || []);
  if (locationChoices.length > 0 && successes.every((result) => result.jobs.length === 0)) {
    return {
      jobs: [],
      total: 0,
      page: state.page,
      pages: 0,
      hasMore: false,
      source: successes.map((result) => result.provider).join('+'),
      locationChoices,
      message: successes.map((result) => result.message).filter(Boolean).join(' | ') || null,
      warnings: failures.map((failure) => failure.reason?.message).filter(Boolean),
    };
  }

  const merged = dedupeJobs(successes.flatMap((result) => result.jobs));
  const filtered = applyLocalFilters(merged, state.filters, state.sort);
  const start = (state.page - 1) * state.pageSize;
  const pagedJobs = filtered.slice(start, start + state.pageSize);
  const total = filtered.length;
  const pages = Math.max(1, Math.ceil(total / state.pageSize));

  return {
    jobs: pagedJobs,
    total,
    page: state.page,
    pages,
    hasMore: state.page < pages,
    source: successes.map((result) => result.provider).join('+'),
    warnings: failures.map((failure) => failure.reason?.message).filter(Boolean),
    message: successes.map((result) => result.message).filter(Boolean).join(' | ') || null,
    cachedForSeconds: JOBS_CACHE_SECONDS,
  };
}
