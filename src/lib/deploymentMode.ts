import type { AccountType } from './profile';

export type DeploymentEnv = Record<string, string | undefined>;

export const PREVIEW_AUTH_COOKIE = 'ladderstar_preview_session';
export const PREVIEW_AUTH_UID = 'preview-business-user';
export const PREVIEW_AUTH_EMAIL = 'preview-business@ladderstar.test';

export const previewBusinessProfile = {
  uid: PREVIEW_AUTH_UID,
  email: PREVIEW_AUTH_EMAIL,
  emailNormalized: PREVIEW_AUTH_EMAIL,
  displayName: 'Preview Business User',
  photoURL: null,
  accountType: 'business' as AccountType,
  role: 'business' as AccountType,
  accountTypeLocked: true,
  accountTypeSource: 'system',
  publicProfileEnabled: false,
  moderationStatus: 'active',
  disabled: false,
  slug: PREVIEW_AUTH_UID,
  headline: 'Preview employer account',
  location: 'Preview City',
  businessProfile: {
    companyName: 'Preview LadderStar Employer',
    website: 'https://preview.ladderstar.com',
    companySize: '11-50',
    description: 'Preview employer account for Vercel PR validation.',
    headquarters: { city: 'Preview City' },
    hiringGoals: 'Validate employer workflows in Vercel preview deployments.',
    culture: { values: 'Preview-safe testing only.', tags: ['Preview', 'QA'] },
  },
  agencyProfile: null,
  socialConnections: [],
  workExperience: [],
  education: [],
  accolades: [],
};

export function getDeploymentEnv(env: DeploymentEnv): string {
  return env.VERCEL_ENV ?? env.NEXT_PUBLIC_VERCEL_ENV ?? (env.NODE_ENV === 'production' ? 'production' : 'development');
}

export function isVercelPreview(env: DeploymentEnv): boolean {
  return getDeploymentEnv(env) === 'preview';
}

export function isPreviewAuthEnabled(env: DeploymentEnv): boolean {
  return isVercelPreview(env) && Boolean(env.PREVIEW_AUTH_SECRET);
}

export function isClientVercelPreview(env: DeploymentEnv): boolean {
  return env.NEXT_PUBLIC_VERCEL_ENV === 'preview';
}
