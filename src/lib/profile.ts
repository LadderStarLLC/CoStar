import {
  doc,
  getDoc,
  getDocs,
  collection,
  query,
  where,
  limit,
  serverTimestamp,
  setDoc,
  updateDoc,
  addDoc,
} from 'firebase/firestore';
import { db } from './firebase';
import type { CompanyData } from './companies';

export type AccountType = 'talent' | 'business' | 'agency' | 'admin' | 'owner';
export type SocialPlatform = 'github' | 'linkedin' | 'email';
export type AccountTypeSource = 'signup' | 'legacy' | 'migration' | 'system';
export type PublicAccountType = 'talent' | 'business' | 'agency';
export type AppearanceScheme = 'ladderstar' | 'light' | 'midnight' | 'high-contrast';
export type BillingStatus = 'free' | 'active' | 'past_due' | 'canceled';
export type AccountStatus = 'active' | 'suspended' | 'disabled';
export type AdminAuditAction =
  | 'user.status.updated'
  | 'user.public_profile.updated'
  | 'user.notes.updated'
  | 'user.role.updated'
  | 'user.wallet.adjusted'
  | 'user.lifecycle.disabled'
  | 'migration.talent.updated';

export interface SocialConnection {
  platform: SocialPlatform;
  id: string;
  label?: string;
  url?: string;
  connected: boolean;
  connectedAt?: any;
}

export interface WorkVibe {
  style: string[];
  culture: string[];
  values: string;
}

export interface BillingProfile {
  provider?: 'stripe' | null;
  stripeCustomerId?: string | null;
  stripeSubscriptionId?: string | null;
  subscriptionStatus?: string | null;
  accountType?: PublicAccountType | null;
  tierId?: string | null;
  tierName?: string | null;
  billingCycle?: 'monthly' | 'annual' | 'free' | null;
  monthlyAllowance?: number;
  currencyLabel?: string;
  lastCheckoutSessionId?: string | null;
  currentPeriodStart?: string | null;
  currentPeriodEnd?: string | null;
  updatedAt?: any;
}

export interface EntitlementsProfile {
  tierId?: string;
  tierName?: string;
  status?: BillingStatus;
  accountType?: PublicAccountType;
  billingCycle?: 'monthly' | 'annual' | 'free';
  currency?: 'minutes' | 'screenings';
  monthlyAllowance?: number;
  features?: Record<string, unknown>;
  updatedAt?: any;
}

export interface UserProfile {
  uid: string;
  email?: string | null;
  emailNormalized?: string | null;
  displayName?: string | null;
  photoURL?: string | null;
  role?: AccountType;
  accountType?: AccountType | null;
  accountTypeLocked?: boolean;
  accountTypeLockedAt?: any;
  accountTypeSource?: AccountTypeSource;
  headline?: string;
  location?: string;
  slug?: string;
  publicProfileEnabled?: boolean;
  appearanceScheme?: AppearanceScheme;
  billing?: BillingProfile | null;
  entitlements?: EntitlementsProfile | null;
  workVibe?: WorkVibe | null;
  socialConnections?: SocialConnection[];
  workExperience?: unknown[];
  education?: unknown[];
  accolades?: unknown[];
  jobPreferences?: Record<string, unknown>;
  businessProfile?: BusinessProfile | null;
  agencyProfile?: AgencyProfile | null;
  talentProfile?: TalentProfile | null;
  privateProfile?: PrivateProfileData | null;
  publicDraft?: PublicProfileDraft | null;
  privateProfileComplete?: number;
  publicProfileComplete?: number;
  profileComplete?: number;
  moderationStatus?: 'active' | 'suspended';
  disabled?: boolean;
  lastAdminActionAt?: any;
  lastAdminActionBy?: string | null;
  adminNotes?: string;
  createdAt?: any;
  updatedAt?: any;
}

export type PublicProfileStatus = 'draft' | 'published' | 'hidden' | 'suspended';

export interface ProfileAsset {
  url?: string;
  path?: string;
  name?: string;
  contentType?: string;
  size?: number;
  uploadedAt?: any;
}

export interface LinkItem {
  label: string;
  url: string;
}

export interface TalentProfile {
  bio?: string;
  phone?: string;
  skills?: string[];
  portfolioLinks?: LinkItem[];
  resume?: ProfileAsset | null;
  certifications?: string[];
  availability?: string;
  desiredRoles?: string[];
  salaryExpectations?: string;
  relocation?: string;
  remotePreference?: string;
}

export interface BusinessCrmData {
  billingContact?: string;
  contactEmail?: string;
  candidatePipeline?: string[];
  notes?: string;
  draftJobNotes?: string;
}

export interface AgencyCrmData {
  clientNotes?: string;
  representedTalentNotes?: string;
  submissionHistory?: string;
  contracts?: string;
  pipeline?: string[];
}

export interface PrivateProfileData {
  phone?: string;
  contactEmail?: string;
  billingEmail?: string;
  businessCrm?: BusinessCrmData;
  agencyCrm?: AgencyCrmData;
}

export interface PublicProfileFields {
  displayName?: string | null;
  photoURL?: string | null;
  headline?: string;
  location?: string;
  email?: string | null;
  phone?: string;
  website?: string;
  bio?: string;
  socialConnections?: SocialConnection[];
  workVibe?: WorkVibe | null;
  talentProfile?: TalentProfile | null;
  businessProfile?: BusinessProfile | null;
  agencyProfile?: AgencyProfile | null;
  showActiveJobsOnProfile?: boolean;
  approvedTalentRoster?: PublicRosterMember[];
}

export type PublicFieldVisibility = Record<string, boolean>;

export interface PublicProfileDraft {
  fields?: PublicProfileFields;
  visibility?: PublicFieldVisibility;
  status?: PublicProfileStatus;
  searchable?: boolean;
  updatedAt?: any;
  lastPublishedAt?: any;
}

export interface PublicRosterMember {
  uid: string;
  slug?: string;
  displayName: string;
  headline?: string;
  photoURL?: string | null;
}

export interface AgencyRosterInvite {
  id?: string;
  agencyUid: string;
  talentUid: string;
  status: 'pending' | 'approved' | 'rejected';
  memberSnapshot?: PublicRosterMember;
  createdAt?: any;
  updatedAt?: any;
}

export interface PublicProfile {
  uid: string;
  accountType: PublicAccountType;
  slug: string;
  status: PublicProfileStatus;
  searchable: boolean;
  moderationStatus: 'active' | 'suspended';
  visibility: PublicFieldVisibility;
  fields: PublicProfileFields;
  createdAt?: any;
  updatedAt?: any;
  publishedAt?: any;
}

export interface BusinessProfile {
  companyId?: string;
  companyName?: string;
  website?: string;
  companySize?: string;
  description?: string;
  headquarters?: {
    city?: string;
    state?: string;
    country?: string;
  };
  culture?: {
    values?: string;
    tags?: string[];
  };
  hiringGoals?: string;
  logoUrl?: string;
  industry?: string;
  remotePolicy?: string;
  benefits?: string[];
  socialLinks?: LinkItem[];
  verified?: boolean;
  showActiveJobsOnProfile?: boolean;
}

export interface AgencyProfile {
  agencyName?: string;
  website?: string;
  description?: string;
  location?: string;
  specialties?: string[];
  industries?: string[];
  services?: string[];
  logoUrl?: string;
  clientTypes?: string[];
  successMetrics?: string;
  featuredPlacements?: string[];
  socialLinks?: LinkItem[];
}

export interface ProfileChecklistItem {
  label: string;
  progress: number;
  complete: boolean;
}

export const emptyWorkVibe: WorkVibe = {
  style: [],
  culture: [],
  values: '',
};

export const accountTypeLabels: Record<AccountType, string> = {
  talent: 'Talent',
  business: 'Employer',
  agency: 'Agency',
  admin: 'Admin',
  owner: 'Owner',
};

export const accountTypes: AccountType[] = ['talent', 'business', 'agency', 'admin', 'owner'];
export const publicSignupAccountTypes: PublicAccountType[] = ['talent', 'business', 'agency'];
export const privilegedAccountTypes: AccountType[] = ['admin', 'owner'];
export const publicAccountTypes: PublicAccountType[] = ['talent', 'business', 'agency'];
export const appearanceSchemes: AppearanceScheme[] = ['ladderstar', 'light', 'midnight', 'high-contrast'];

export function isAccountType(value: unknown): value is AccountType {
  return typeof value === 'string' && accountTypes.includes(value as AccountType);
}

export function normalizeAccountType(value: unknown): AccountType | null {
  if (value === 'user') return 'talent';
  return accountTypes.includes(value as AccountType) ? value as AccountType : null;
}

export function isPublicAccountType(value: unknown): value is PublicAccountType {
  return normalizeAccountType(value) !== null && publicAccountTypes.includes(normalizeAccountType(value) as PublicAccountType);
}

export function isPrivilegedAccountType(value: unknown): value is 'admin' | 'owner' {
  const accountType = normalizeAccountType(value);
  return accountType === 'admin' || accountType === 'owner';
}

export function normalizeAppearanceScheme(value: unknown): AppearanceScheme {
  return appearanceSchemes.includes(value as AppearanceScheme) ? value as AppearanceScheme : 'ladderstar';
}

export function normalizeEmail(email?: string | null): string | null {
  return email?.trim().toLowerCase() || null;
}

export function createSlug(value?: string | null, fallback?: string): string {
  const base = (value || fallback || 'profile')
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '');

  return base || 'profile';
}

export async function isSlugAvailable(slug: string, excludeUid?: string): Promise<boolean> {
  if (!db) throw new Error('Firestore not initialized');
  const q = query(collection(db, 'users'), where('slug', '==', slug), limit(1));
  const snapshot = await getDocs(q);
  if (snapshot.empty) return true;
  if (excludeUid && snapshot.docs[0].id === excludeUid) return true;
  return false;
}

export async function generateUniqueSlug(value: string | null | undefined, uid: string): Promise<string> {
  const baseSlug = createSlug(value, uid);
  let slug = baseSlug;
  let counter = 1;

  while (!(await isSlugAvailable(slug, uid))) {
    slug = `${baseSlug}-${counter}`;
    counter++;
    if (counter > 100) break; // Safety break
  }

  return slug;
}

export function normalizeProfile(uid: string, data: Partial<UserProfile> = {}): UserProfile {
  const accountType = normalizeAccountType(data.accountType);
  const role = normalizeAccountType(data.role) ?? accountType ?? 'talent';
  return {
    uid,
    email: data.email ?? null,
    emailNormalized: data.emailNormalized ?? normalizeEmail(data.email),
    displayName: data.displayName ?? '',
    photoURL: data.photoURL ?? null,
    role,
    accountType,
    accountTypeLocked: data.accountTypeLocked ?? Boolean(accountType),
    accountTypeLockedAt: data.accountTypeLockedAt,
    accountTypeSource: data.accountTypeSource,
    headline: data.headline ?? '',
    location: data.location ?? '',
    slug: data.slug ?? createSlug(data.displayName ?? data.email ?? uid, uid),
    publicProfileEnabled: data.publicProfileEnabled ?? true,
    appearanceScheme: normalizeAppearanceScheme(data.appearanceScheme),
    billing: data.billing ?? null,
    entitlements: data.entitlements ?? null,
    workVibe: data.workVibe ?? emptyWorkVibe,
    socialConnections: data.socialConnections ?? [],
    workExperience: data.workExperience ?? [],
    education: data.education ?? [],
    accolades: data.accolades ?? [],
    jobPreferences: data.jobPreferences ?? {},
    businessProfile: data.businessProfile ?? null,
    agencyProfile: data.agencyProfile ?? null,
    talentProfile: data.talentProfile ?? null,
    privateProfile: data.privateProfile ?? null,
    publicDraft: data.publicDraft ?? null,
    privateProfileComplete: data.privateProfileComplete ?? data.profileComplete ?? 0,
    publicProfileComplete: data.publicProfileComplete ?? 0,
    profileComplete: data.profileComplete ?? data.privateProfileComplete ?? 0,
    moderationStatus: data.moderationStatus ?? 'active',
    disabled: data.disabled ?? false,
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  };
}

export function getPublicProfilePath(accountType: PublicAccountType, slugOrUid: string): string {
  if (accountType === 'business') return `/business/${slugOrUid}`;
  if (accountType === 'agency') return `/agency/${slugOrUid}`;
  return `/talent/${slugOrUid}`;
}

export function normalizePublicProfile(uid: string, data: Partial<PublicProfile> = {}): PublicProfile | null {
  const accountType = normalizeAccountType(data.accountType);
  if (!isPublicAccountType(accountType)) return null;

  return {
    uid,
    accountType,
    slug: data.slug ?? createSlug(data.fields?.displayName ?? uid, uid),
    status: data.status ?? 'draft',
    searchable: data.searchable ?? false,
    moderationStatus: data.moderationStatus ?? 'active',
    visibility: data.visibility ?? {},
    fields: data.fields ?? {},
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
    publishedAt: data.publishedAt,
  };
}

export function getProfileDisplayName(profile: UserProfile | PublicProfile): string {
  if ('fields' in profile) {
    const business = profile.fields.businessProfile;
    const agency = profile.fields.agencyProfile;
    if (profile.accountType === 'business') return business?.companyName || profile.fields.displayName || 'Business Profile';
    if (profile.accountType === 'agency') return agency?.agencyName || profile.fields.displayName || 'Agency Profile';
    return profile.fields.displayName || 'Talent Profile';
  }

  if (profile.accountType === 'business') return profile.businessProfile?.companyName || profile.displayName || 'Business Profile';
  if (profile.accountType === 'agency') return profile.agencyProfile?.agencyName || profile.displayName || 'Agency Profile';
  return profile.displayName || 'Talent Profile';
}

export function defaultPublicVisibility(accountType?: AccountType | null): PublicFieldVisibility {
  return {
    displayName: true,
    photoURL: false,
    headline: false,
    location: false,
    email: false,
    phone: false,
    website: false,
    bio: false,
    socialConnections: false,
    workVibe: false,
    skills: false,
    portfolioLinks: false,
    resume: false,
    workExperience: false,
    education: false,
    certifications: false,
    availability: false,
    desiredRoles: false,
    salaryExpectations: false,
    relocation: false,
    remotePreference: false,
    companySize: accountType === 'business' ? false : false,
    industry: accountType === 'business' ? false : false,
    headquarters: accountType === 'business' ? false : false,
    culture: accountType === 'business' ? false : false,
    benefits: accountType === 'business' ? false : false,
    hiringGoals: accountType === 'business' ? false : false,
    activeJobs: accountType === 'business' ? false : false,
    services: accountType === 'agency' ? false : false,
    specialties: accountType === 'agency' ? false : false,
    industries: accountType === 'agency' ? false : false,
    clientTypes: accountType === 'agency' ? false : false,
    successMetrics: accountType === 'agency' ? false : false,
    featuredPlacements: accountType === 'agency' ? false : false,
    talentRoster: accountType === 'agency' ? false : false,
  };
}

export function buildPublicFieldsFromPrivate(profile: UserProfile): PublicProfileFields {
  return {
    displayName: getProfileDisplayName(profile),
    photoURL: profile.photoURL ?? null,
    headline: profile.headline ?? '',
    location: profile.location ?? '',
    email: profile.email ?? null,
    phone: profile.privateProfile?.phone ?? profile.talentProfile?.phone ?? '',
    website: profile.businessProfile?.website ?? profile.agencyProfile?.website ?? '',
    bio: profile.talentProfile?.bio ?? '',
    socialConnections: profile.socialConnections ?? [],
    workVibe: profile.workVibe ?? emptyWorkVibe,
    talentProfile: profile.talentProfile ?? null,
    businessProfile: profile.businessProfile ?? null,
    agencyProfile: profile.agencyProfile ?? null,
    showActiveJobsOnProfile: Boolean(profile.businessProfile?.showActiveJobsOnProfile),
    approvedTalentRoster: profile.publicDraft?.fields?.approvedTalentRoster ?? [],
  };
}

export function filterPublishedFields(fields: PublicProfileFields, visibility: PublicFieldVisibility): PublicProfileFields {
  const business = fields.businessProfile;
  const agency = fields.agencyProfile;
  const talent = fields.talentProfile;

  return {
    displayName: fields.displayName,
    photoURL: visibility.photoURL ? fields.photoURL ?? null : null,
    headline: visibility.headline ? fields.headline : '',
    location: visibility.location ? fields.location : '',
    email: visibility.email ? fields.email ?? null : null,
    phone: visibility.phone ? fields.phone : '',
    website: visibility.website ? fields.website : '',
    bio: visibility.bio ? fields.bio : '',
    socialConnections: visibility.socialConnections ? fields.socialConnections ?? [] : [],
    workVibe: visibility.workVibe ? fields.workVibe ?? emptyWorkVibe : emptyWorkVibe,
    talentProfile: talent ? {
      ...talent,
      skills: visibility.skills ? talent.skills ?? [] : [],
      portfolioLinks: visibility.portfolioLinks ? talent.portfolioLinks ?? [] : [],
      resume: visibility.resume ? talent.resume ?? null : null,
      certifications: visibility.certifications ? talent.certifications ?? [] : [],
      availability: visibility.availability ? talent.availability ?? '' : '',
      desiredRoles: visibility.desiredRoles ? talent.desiredRoles ?? [] : [],
      salaryExpectations: visibility.salaryExpectations ? talent.salaryExpectations ?? '' : '',
      relocation: visibility.relocation ? talent.relocation ?? '' : '',
      remotePreference: visibility.remotePreference ? talent.remotePreference ?? '' : '',
    } : null,
    businessProfile: business ? {
      ...business,
      website: visibility.website ? business.website ?? '' : '',
      companySize: visibility.companySize ? business.companySize ?? '' : '',
      industry: visibility.industry ? business.industry ?? '' : '',
      headquarters: visibility.headquarters ? business.headquarters : {},
      culture: visibility.culture ? business.culture : { values: '', tags: [] },
      benefits: visibility.benefits ? business.benefits ?? [] : [],
      hiringGoals: visibility.hiringGoals ? business.hiringGoals ?? '' : '',
      showActiveJobsOnProfile: Boolean(visibility.activeJobs && business.showActiveJobsOnProfile),
    } : null,
    agencyProfile: agency ? {
      ...agency,
      website: visibility.website ? agency.website ?? '' : '',
      services: visibility.services ? agency.services ?? [] : [],
      specialties: visibility.specialties ? agency.specialties ?? [] : [],
      industries: visibility.industries ? agency.industries ?? [] : [],
      clientTypes: visibility.clientTypes ? agency.clientTypes ?? [] : [],
      successMetrics: visibility.successMetrics ? agency.successMetrics ?? '' : '',
      featuredPlacements: visibility.featuredPlacements ? agency.featuredPlacements ?? [] : [],
    } : null,
    showActiveJobsOnProfile: Boolean(visibility.activeJobs && fields.showActiveJobsOnProfile),
    approvedTalentRoster: visibility.talentRoster ? fields.approvedTalentRoster ?? [] : [],
  };
}

export function calculatePublicProfileComplete(profile: Partial<UserProfile> | null): number {
  if (!profile?.accountType) return 0;
  const visibility = profile.publicDraft?.visibility ?? defaultPublicVisibility(profile.accountType);
  const fields = profile.publicDraft?.fields ?? buildPublicFieldsFromPrivate(normalizeProfile(profile.uid ?? 'preview', profile));
  const visibleCount = Object.values(visibility).filter(Boolean).length;
  const hasRequiredName = Boolean(fields.displayName || fields.businessProfile?.companyName || fields.agencyProfile?.agencyName);
  return Math.min(100, Math.round((hasRequiredName ? 20 : 0) + Math.min(80, visibleCount * 8)));
}

function mapCompanyToProfile(companyId: string, data: CompanyData): UserProfile {
  const logoUrl = (data as CompanyData & { logoUrl?: string }).logoUrl;
  const cultureValues = data.culture?.values ?? [];
  const cultureTags = [
    ...cultureValues,
    ...(data.culture?.perks ?? []),
    ...(data.culture?.benefits ?? []),
  ];
  const location = [
    data.headquarters?.city,
    data.headquarters?.state,
    data.headquarters?.country,
  ].filter(Boolean).join(', ');

  return normalizeProfile(data.employerId || companyId, {
    displayName: data.name ?? '',
    photoURL: data.logo ?? logoUrl ?? null,
    accountType: 'business',
    role: 'business',
    headline: data.tagline ?? data.description ?? '',
    location,
    slug: data.slug ?? createSlug(data.name, companyId),
    publicProfileEnabled: true,
    businessProfile: {
      companyId,
      companyName: data.name ?? '',
      website: data.website ?? '',
      companySize: data.companySize ?? '',
      description: data.description ?? data.tagline ?? '',
      headquarters: data.headquarters,
      culture: {
        values: cultureValues.join(', '),
        tags: cultureTags,
      },
      hiringGoals: data.hiringCount ? `${data.hiringCount} active hiring needs` : '',
    },
    createdAt: data.createdAt,
    updatedAt: data.updatedAt,
  });
}

export function getSocialConnection(
  profile: Pick<UserProfile, 'socialConnections'> | null,
  platform: SocialPlatform
): SocialConnection | null {
  return profile?.socialConnections?.find((connection) => connection.platform === platform) ?? null;
}

export function upsertSocialConnection(
  connections: SocialConnection[] = [],
  next: SocialConnection
): SocialConnection[] {
  const withoutPlatform = connections.filter((connection) => connection.platform !== next.platform);
  return [...withoutPlatform, next];
}

export function buildProfileChecklist(profile: Partial<UserProfile> | null): ProfileChecklistItem[] {
  const accountType = profile?.accountType ?? null;
  if (accountType === 'business') return buildBusinessChecklist(profile);
  if (accountType === 'agency') return buildAgencyChecklist(profile);

  const workVibe = profile?.workVibe ?? emptyWorkVibe;
  const socialConnections = profile?.socialConnections ?? [];
  const hasBasicInfo = Boolean(profile?.displayName?.trim() && profile?.headline?.trim() && profile?.location?.trim());
  const hasWorkVibe = Boolean(
    workVibe.style.length > 0 &&
    workVibe.culture.length > 0 &&
    workVibe.values.trim()
  );

  return [
    { label: 'Basic Information', progress: hasBasicInfo ? 100 : 0, complete: hasBasicInfo },
    { label: 'Account Type', progress: profile?.accountType ? 100 : 0, complete: Boolean(profile?.accountType) },
    {
      label: 'Social Connections',
      progress: socialConnections.some((connection) => connection.connected) ? 100 : 0,
      complete: socialConnections.some((connection) => connection.connected),
    },
    { label: 'Work Vibe Assessment', progress: hasWorkVibe ? 100 : 0, complete: hasWorkVibe },
    {
      label: 'Work Experience',
      progress: (profile?.workExperience?.length ?? 0) > 0 ? 100 : 0,
      complete: (profile?.workExperience?.length ?? 0) > 0,
    },
    {
      label: 'Education',
      progress: (profile?.education?.length ?? 0) > 0 ? 100 : 0,
      complete: (profile?.education?.length ?? 0) > 0,
    },
  ];
}

function buildBusinessChecklist(profile: Partial<UserProfile> | null): ProfileChecklistItem[] {
  const business = profile?.businessProfile ?? null;
  const headquarters = business?.headquarters;

  return [
    {
      label: 'Account Type',
      progress: profile?.accountType === 'business' ? 100 : 0,
      complete: profile?.accountType === 'business',
    },
    {
      label: 'Representative Info',
      progress: profile?.displayName?.trim() && profile?.email ? 100 : 0,
      complete: Boolean(profile?.displayName?.trim() && profile?.email),
    },
    {
      label: 'Company Basics',
      progress: business?.companyName?.trim() && business?.website?.trim() ? 100 : 0,
      complete: Boolean(business?.companyName?.trim() && business?.website?.trim()),
    },
    {
      label: 'Company Location',
      progress: headquarters?.city?.trim() || headquarters?.country?.trim() ? 100 : 0,
      complete: Boolean(headquarters?.city?.trim() || headquarters?.country?.trim()),
    },
    {
      label: 'Culture & Hiring Goals',
      progress: business?.description?.trim() || business?.hiringGoals?.trim() ? 100 : 0,
      complete: Boolean(business?.description?.trim() || business?.hiringGoals?.trim()),
    },
  ];
}

function buildAgencyChecklist(profile: Partial<UserProfile> | null): ProfileChecklistItem[] {
  const agency = profile?.agencyProfile ?? null;

  return [
    {
      label: 'Account Type',
      progress: profile?.accountType === 'agency' ? 100 : 0,
      complete: profile?.accountType === 'agency',
    },
    {
      label: 'Representative Info',
      progress: profile?.displayName?.trim() && profile?.email ? 100 : 0,
      complete: Boolean(profile?.displayName?.trim() && profile?.email),
    },
    {
      label: 'Agency Basics',
      progress: agency?.agencyName?.trim() && agency?.description?.trim() ? 100 : 0,
      complete: Boolean(agency?.agencyName?.trim() && agency?.description?.trim()),
    },
    {
      label: 'Services',
      progress: (agency?.services?.length ?? 0) > 0 ? 100 : 0,
      complete: (agency?.services?.length ?? 0) > 0,
    },
    {
      label: 'Specialties',
      progress: (agency?.specialties?.length ?? 0) > 0 || (agency?.industries?.length ?? 0) > 0 ? 100 : 0,
      complete: (agency?.specialties?.length ?? 0) > 0 || (agency?.industries?.length ?? 0) > 0,
    },
  ];
}

export function calculateProfileComplete(profile: Partial<UserProfile> | null): number {
  const checklist = buildProfileChecklist(profile);
  const total = checklist.reduce((sum, item) => sum + item.progress, 0);
  return Math.round(total / checklist.length);
}

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
  if (!db) throw new Error('Firestore not initialized');

  const profileRef = doc(db, 'users', uid);
  const profileSnap = await getDoc(profileRef);

  if (!profileSnap.exists()) return null;

  const profile = normalizeProfile(uid, profileSnap.data() as Partial<UserProfile>);
  return {
    ...profile,
    profileComplete: calculateProfileComplete(profile),
  };
}

export async function getPublicProfileBySlugOrUid(
  slugOrUid: string,
  accountType?: AccountType
): Promise<PublicProfile | null> {
  if (!db) throw new Error('Firestore not initialized');

  const normalizedSlug = slugOrUid.toLowerCase();
  const normalizedType = normalizeAccountType(accountType);

  const directSnap = await getDoc(doc(db, 'publicProfiles', slugOrUid));
  if (directSnap.exists()) {
    const directProfile = normalizePublicProfile(directSnap.id, directSnap.data() as Partial<PublicProfile>);
    if (
      directProfile &&
      directProfile.status === 'published' &&
      directProfile.moderationStatus === 'active' &&
      (!normalizedType || directProfile.accountType === normalizedType)
    ) {
      return directProfile;
    }
  }

  const snapshot = await getDocs(query(
    collection(db, 'publicProfiles'),
    where('slug', '==', normalizedSlug),
    where('status', '==', 'published'),
    where('moderationStatus', '==', 'active')
  ));
  if (!snapshot.empty) {
    const profileSnap = snapshot.docs.find((docSnap) => {
      const data = docSnap.data() as Partial<PublicProfile>;
      return (!normalizedType || normalizeAccountType(data.accountType) === normalizedType);
    });
    if (profileSnap) {
      return normalizePublicProfile(profileSnap.id, profileSnap.data() as Partial<PublicProfile>);
    }
  }

  return null;
}

export async function getPublishedPublicProfile(uid: string): Promise<PublicProfile | null> {
  if (!db) throw new Error('Firestore not initialized');
  const snap = await getDoc(doc(db, 'publicProfiles', uid));
  if (!snap.exists()) return null;
  return normalizePublicProfile(snap.id, snap.data() as Partial<PublicProfile>);
}

export async function saveUserProfile(uid: string, updates: Partial<UserProfile>): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  const current = await getUserProfile(uid);
  if (current?.accountTypeLocked && updates.accountType && updates.accountType !== current.accountType) {
    throw new Error('Account type is locked for this account.');
  }

  const next = normalizeProfile(uid, {
    ...(current ?? {}),
    ...updates,
    role: updates.accountType ?? updates.role ?? current?.role,
    emailNormalized: updates.emailNormalized ?? normalizeEmail(updates.email ?? current?.email),
  });
  const profileComplete = calculateProfileComplete(next);
  const publicProfileComplete = calculatePublicProfileComplete(next);
  const profileRef = doc(db, 'users', uid);

  if (current) {
    const protectedUpdates = { ...updates };
    if (current.accountTypeLocked) {
      delete protectedUpdates.accountType;
      delete protectedUpdates.accountTypeLocked;
      delete protectedUpdates.accountTypeLockedAt;
      delete protectedUpdates.accountTypeSource;
      delete protectedUpdates.role;
    }

    await updateDoc(profileRef, {
      ...protectedUpdates,
      emailNormalized: protectedUpdates.emailNormalized ?? normalizeEmail(protectedUpdates.email ?? current.email),
      profileComplete,
      privateProfileComplete: profileComplete,
      publicProfileComplete,
      updatedAt: serverTimestamp(),
    });
    return;
  }

  await setDoc(profileRef, {
    ...next,
    accountTypeLocked: Boolean(next.accountType),
    accountTypeLockedAt: next.accountType ? serverTimestamp() : null,
    accountTypeSource: next.accountType ? next.accountTypeSource ?? 'signup' : null,
    profileComplete,
    privateProfileComplete: profileComplete,
    publicProfileComplete,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
}

export async function savePublicProfileDraft(
  uid: string,
  updates: {
    fields?: PublicProfileFields;
    visibility?: PublicFieldVisibility;
    searchable?: boolean;
    status?: PublicProfileStatus;
  }
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const current = await getUserProfile(uid);
  if (!current) throw new Error('Profile not found.');

  const publicDraft: PublicProfileDraft = {
    ...(current.publicDraft ?? {}),
    fields: updates.fields ?? current.publicDraft?.fields ?? buildPublicFieldsFromPrivate(current),
    visibility: updates.visibility ?? current.publicDraft?.visibility ?? defaultPublicVisibility(current.accountType),
    searchable: updates.searchable ?? current.publicDraft?.searchable ?? true,
    status: updates.status ?? current.publicDraft?.status ?? 'draft',
    updatedAt: serverTimestamp(),
    lastPublishedAt: current.publicDraft?.lastPublishedAt,
  };

  await updateDoc(doc(db, 'users', uid), {
    publicDraft,
    publicProfileComplete: calculatePublicProfileComplete({ ...current, publicDraft }),
    updatedAt: serverTimestamp(),
  });
}

export async function publishPublicProfile(uid: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  const current = await getUserProfile(uid);
  if (!current || !isPublicAccountType(current.accountType)) {
    throw new Error('Only public account types can publish profiles.');
  }

  const fields = current.publicDraft?.fields ?? buildPublicFieldsFromPrivate(current);
  const visibility = {
    ...defaultPublicVisibility(current.accountType),
    ...(current.publicDraft?.visibility ?? {}),
    displayName: true,
  };
  const slug = current.slug || createSlug(getProfileDisplayName(current), uid);
  const publicProfile: PublicProfile = {
    uid,
    accountType: current.accountType,
    slug,
    status: 'published',
    searchable: current.publicDraft?.searchable ?? true,
    moderationStatus: current.moderationStatus ?? 'active',
    visibility,
    fields: filterPublishedFields(fields, visibility),
    publishedAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  };

  await setDoc(doc(db, 'publicProfiles', uid), publicProfile, { merge: true });
  await updateDoc(doc(db, 'users', uid), {
    slug,
    publicProfileEnabled: true,
    publicDraft: {
      ...(current.publicDraft ?? {}),
      fields,
      visibility,
      searchable: publicProfile.searchable,
      status: 'published',
      lastPublishedAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    },
    publicProfileComplete: calculatePublicProfileComplete({ ...current, publicDraft: { fields, visibility } }),
    updatedAt: serverTimestamp(),
  });
}

export async function hidePublicProfile(uid: string): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  await setDoc(doc(db, 'publicProfiles', uid), {
    status: 'hidden',
    searchable: false,
    updatedAt: serverTimestamp(),
  }, { merge: true });
  await updateDoc(doc(db, 'users', uid), {
    publicProfileEnabled: false,
    'publicDraft.status': 'hidden',
    updatedAt: serverTimestamp(),
  });
}

export async function inviteTalentToAgencyRoster(agencyUid: string, talentUid: string): Promise<string> {
  if (!db) throw new Error('Firestore not initialized');
  const ref = await addDoc(collection(db, 'agencyRosterInvites'), {
    agencyUid,
    talentUid,
    status: 'pending',
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });
  return ref.id;
}

export async function respondToAgencyRosterInvite(inviteId: string, approved: boolean): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');
  await updateDoc(doc(db, 'agencyRosterInvites', inviteId), {
    status: approved ? 'approved' : 'rejected',
    updatedAt: serverTimestamp(),
  });
}

export async function createOrSyncUserProfileFromAuth(
  authUser: {
    uid: string;
    email?: string | null;
    displayName?: string | null;
    photoURL?: string | null;
  },
  requestedType?: AccountType | null
): Promise<UserProfile> {
  if (!db) throw new Error('Firestore not initialized');

  const existing = await getUserProfile(authUser.uid);
  const profileRef = doc(db, 'users', authUser.uid);
  const authFields = {
    uid: authUser.uid,
    email: authUser.email ?? null,
    emailNormalized: normalizeEmail(authUser.email),
    displayName: existing?.displayName || authUser.displayName || '',
    photoURL: authUser.photoURL ?? null,
    slug: existing?.slug ?? createSlug(authUser.displayName ?? authUser.email, authUser.uid),
  };

  if (existing) {
    const updates: Partial<UserProfile> = {
      ...authFields,
      updatedAt: serverTimestamp(),
    };

    if (existing.accountType && !existing.accountTypeLocked) {
      updates.accountTypeLocked = true;
      updates.accountTypeLockedAt = serverTimestamp();
      updates.accountTypeSource = existing.accountTypeSource ?? 'legacy';
      updates.role = existing.accountType;
    } else if (!existing.accountType && requestedType) {
      updates.accountType = requestedType;
      updates.role = requestedType;
      updates.accountTypeLocked = true;
      updates.accountTypeLockedAt = serverTimestamp();
      updates.accountTypeSource = 'signup';
    }

    await updateDoc(profileRef, updates);
    return normalizeProfile(authUser.uid, { ...existing, ...updates });
  }

  const next = normalizeProfile(authUser.uid, {
    ...authFields,
    accountType: requestedType ?? null,
    role: requestedType ?? 'talent',
    accountTypeLocked: Boolean(requestedType),
    accountTypeSource: requestedType ? 'signup' : undefined,
  });

  await setDoc(profileRef, {
    ...next,
    accountTypeLockedAt: requestedType ? serverTimestamp() : null,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
  });

  return next;
}

export async function lockAccountType(
  uid: string,
  accountType: AccountType,
  source: AccountTypeSource = 'signup'
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  const current = await getUserProfile(uid);
  if (current?.accountTypeLocked && current.accountType && current.accountType !== accountType) {
    throw new Error('Account type is locked for this account.');
  }

  const profileRef = doc(db, 'users', uid);
  await updateDoc(profileRef, {
    accountType,
    role: accountType,
    accountTypeLocked: true,
    accountTypeLockedAt: current?.accountTypeLockedAt ?? serverTimestamp(),
    accountTypeSource: current?.accountTypeSource ?? source,
    profileComplete: calculateProfileComplete({ ...(current ?? {}), accountType, role: accountType }),
    updatedAt: serverTimestamp(),
  });
}

export async function saveTypeSpecificProfile(
  uid: string,
  accountType: AccountType,
  updates: Partial<UserProfile>
): Promise<void> {
  const current = await getUserProfile(uid);
  if (current?.accountType && current.accountType !== accountType) {
    throw new Error('Cannot save profile data for a different account type.');
  }

  await saveUserProfile(uid, {
    ...updates,
    accountType: current?.accountType ?? accountType,
    role: current?.accountType ?? accountType,
  });
}

export function getCurrentAccountPath(profile: Partial<UserProfile> | null | undefined): AccountType | null {
  return profile?.accountType ?? null;
}

export function createPreviewProfile(
  operator: Partial<UserProfile>,
  accountType: PublicAccountType
): UserProfile {
  const displayName = operator.displayName || operator.email || 'Preview Account';
  return normalizeProfile(operator.uid || `preview-${accountType}`, {
    uid: operator.uid || `preview-${accountType}`,
    email: operator.email ?? null,
    displayName,
    photoURL: operator.photoURL ?? null,
    accountType,
    role: accountType,
    headline:
      accountType === 'business'
        ? 'Hiring team on CoStar'
        : accountType === 'agency'
        ? 'Talent agency on CoStar'
        : 'Talent on CoStar',
    location: '',
    slug: createSlug(displayName, operator.uid),
    publicProfileEnabled: false,
    workVibe: emptyWorkVibe,
    businessProfile: accountType === 'business' ? {
      companyName: displayName,
      companySize: '1-10',
      description: '',
      headquarters: { city: '' },
      hiringGoals: '',
      culture: { values: '', tags: [] },
    } : null,
    agencyProfile: accountType === 'agency' ? {
      agencyName: displayName,
      description: '',
      location: '',
      specialties: [],
      services: [],
    } : null,
  });
}

export async function getOperatorPreviewProfile(
  operatorUid: string,
  accountType: PublicAccountType,
  operator: Partial<UserProfile>
): Promise<UserProfile> {
  if (!db) throw new Error('Firestore not initialized');

  const previewRef = doc(db, 'operatorPreviewProfiles', operatorUid, 'paths', accountType);
  const previewSnap = await getDoc(previewRef);
  if (!previewSnap.exists()) return createPreviewProfile(operator, accountType);

  const preview = normalizeProfile(operatorUid, {
    ...previewSnap.data() as Partial<UserProfile>,
    uid: operatorUid,
    accountType,
    role: accountType,
  });
  return {
    ...preview,
    profileComplete: calculateProfileComplete(preview),
  };
}

export async function saveOperatorPreviewProfile(
  operatorUid: string,
  accountType: PublicAccountType,
  updates: Partial<UserProfile>
): Promise<void> {
  if (!db) throw new Error('Firestore not initialized');

  const previewRef = doc(db, 'operatorPreviewProfiles', operatorUid, 'paths', accountType);
  const next = normalizeProfile(operatorUid, {
    ...updates,
    uid: operatorUid,
    accountType,
    role: accountType,
    publicProfileEnabled: false,
  });

  await setDoc(previewRef, {
    ...next,
    accountType,
    role: accountType,
    publicProfileEnabled: false,
    profileComplete: calculateProfileComplete(next),
    updatedAt: serverTimestamp(),
  }, { merge: true });
}
