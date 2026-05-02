"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";
import {
  Briefcase,
  Building2,
  Download,
  ExternalLink,
  Mail,
  MapPin,
  Phone,
  ShieldCheck,
  Sparkles,
  User,
  Users2,
} from "lucide-react";
import { getJobsByEmployer, type JobData } from "@/lib/jobs";
import {
  accountTypeLabels,
  getProfileDisplayName,
  type PublicProfile,
} from "@/lib/profile";
import ProfileCTA from "./ProfileCTA";

interface PublicProfileViewProps {
  profile: PublicProfile;
  preview?: boolean;
}

export default function PublicProfileView({ profile, preview = false }: PublicProfileViewProps) {
  const fields = profile.fields;
  const accountType = profile.accountType;
  const displayName = getProfileDisplayName(profile);
  const headline = fields.headline || fields.bio || "";
  const [jobs, setJobs] = useState<JobData[]>([]);

  useEffect(() => {
    if (accountType !== "business" || !fields.showActiveJobsOnProfile) return;
    getJobsByEmployer(profile.uid)
      .then((items) => setJobs(items.filter((job) => job.status === "active" && job.visibility !== "private")))
      .catch(console.error);
  }, [accountType, fields.showActiveJobsOnProfile, profile.uid]);

  const Icon = accountType === "business" ? Building2 : accountType === "agency" ? Users2 : User;
  const website = fields.website || fields.businessProfile?.website || fields.agencyProfile?.website;

  return (
    <div className="min-h-screen bg-[#1A1D20] text-[#F4F5F7]">
      <main>
        <section className="border-b border-white/10 bg-[#262A2E]">
          <div className="mx-auto max-w-6xl px-6 py-10">
            <Link href="/" className="text-sm font-medium text-[#E5B536] hover:text-[#5DC99B]">
              Back to LadderStar
            </Link>
            {preview && (
              <div className="mt-5 inline-flex rounded-full border border-[#E5B536]/30 bg-[#E5B536]/10 px-3 py-1 text-sm text-[#E5B536]">
                Draft preview
              </div>
            )}

            <div className="mt-8 grid gap-8 lg:grid-cols-[1fr_280px] lg:items-end">
              <div className="flex flex-col gap-6 sm:flex-row">
                <div className="flex h-28 w-28 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#1A1D20]">
                  {fields.photoURL ? (
                    <img src={fields.photoURL} alt="" className="h-full w-full object-cover" />
                  ) : (
                    <Icon className="h-12 w-12 text-[#E5B536]" />
                  )}
                </div>
                <div className="min-w-0">
                  <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-sm text-[#F4F5F7]/70">
                    <Icon className="h-4 w-4 text-[#5DC99B]" />
                    {accountTypeLabels[accountType]}
                  </div>
                  <h1 className="break-words text-4xl font-bold tracking-tight text-white sm:text-5xl">{displayName}</h1>
                  {headline && <p className="mt-4 max-w-3xl text-lg leading-8 text-[#F4F5F7]/75">{headline}</p>}
                  <div className="mt-5 flex flex-wrap gap-3 text-sm text-[#F4F5F7]/65">
                    {fields.location && <InlineFact icon={<MapPin className="h-4 w-4" />} value={fields.location} />}
                    {fields.email && <InlineFact icon={<Mail className="h-4 w-4" />} value={fields.email} />}
                    {fields.phone && <InlineFact icon={<Phone className="h-4 w-4" />} value={fields.phone} />}
                    {website && <ExternalLinkRow href={website} label="Website" compact />}
                  </div>
                </div>
              </div>
              <div className="flex justify-start lg:justify-end">
                <ProfileCTA targetId={profile.uid} targetRole={accountType} />
              </div>
            </div>
          </div>
        </section>

        <div className="mx-auto grid max-w-6xl gap-6 px-6 py-8 lg:grid-cols-[1fr_320px]">
          <div className="space-y-6">
            {accountType === "talent" && <TalentProfile profile={profile} />}
            {accountType === "business" && <BusinessProfile profile={profile} jobs={jobs} />}
            {accountType === "agency" && <AgencyProfile profile={profile} />}
          </div>

          <aside className="space-y-6">
            <ProfileSection title="Public Details">
              <Fact label="Profile status" value={profile.status} />
              <Fact label="Visibility" value={profile.searchable ? "Searchable" : "Unlisted"} />
              {fields.workVibe?.values && <Fact label="Work Vibe" value={fields.workVibe.values} />}
            </ProfileSection>
            {fields.socialConnections && fields.socialConnections.length > 0 && (
              <ProfileSection title="Verified Links">
                <TagList tags={fields.socialConnections.filter((item) => item.connected).map((item) => item.label || item.platform)} />
              </ProfileSection>
            )}
          </aside>
        </div>
      </main>
    </div>
  );
}

function TalentProfile({ profile }: { profile: PublicProfile }) {
  const talent = profile.fields.talentProfile;
  return (
    <>
      <ProfileSection title="Talent Snapshot">
        <Fact label="Bio" value={profile.fields.bio} />
        <TagList tags={talent?.skills ?? []} />
        {talent?.resume?.url && <ExternalLinkRow href={talent.resume.url} label="Download resume" icon={<Download className="h-4 w-4" />} />}
      </ProfileSection>
      <ProfileSection title="Career Direction">
        <TagList tags={talent?.desiredRoles ?? []} empty="No public role targets yet." />
        <Fact label="Availability" value={talent?.availability} />
        <Fact label="Remote preference" value={talent?.remotePreference} />
        <Fact label="Relocation" value={talent?.relocation} />
        <Fact label="Salary expectations" value={talent?.salaryExpectations} />
      </ProfileSection>
      <ProfileSection title="Portfolio & Credentials">
        <TagList tags={talent?.certifications ?? []} empty="No public credentials yet." />
        <div className="space-y-2">
          {(talent?.portfolioLinks ?? []).map((link) => (
            <ExternalLinkRow key={link.url} href={link.url} label={link.label || link.url} />
          ))}
        </div>
      </ProfileSection>
    </>
  );
}

function BusinessProfile({ profile, jobs }: { profile: PublicProfile; jobs: JobData[] }) {
  const business = profile.fields.businessProfile;
  return (
    <>
      <ProfileSection title="Company">
        <Fact label="About" value={business?.description || profile.fields.bio} />
        <Fact label="Industry" value={business?.industry} />
        <Fact label="Company size" value={business?.companySize} />
        <Fact label="Hiring goals" value={business?.hiringGoals} />
        {business?.verified && <InlineFact icon={<ShieldCheck className="h-4 w-4" />} value="Verified employer" />}
      </ProfileSection>
      <ProfileSection title="Culture & Benefits">
        <Fact label="Values" value={business?.culture?.values} />
        <TagList tags={[...(business?.culture?.tags ?? []), ...(business?.benefits ?? [])]} />
      </ProfileSection>
      {profile.fields.showActiveJobsOnProfile && (
        <ProfileSection title="Open Roles">
          {jobs.length === 0 ? (
            <p className="text-[#F4F5F7]/50">No active public jobs right now.</p>
          ) : (
            <div className="space-y-3">
              {jobs.map((job) => (
                <Link key={job.jobId} href={`/jobs/${job.slug || job.jobId}`} className="block rounded-lg border border-white/10 bg-[#1A1D20] p-4 hover:border-[#5DC99B]/60">
                  <div className="font-semibold text-white">{job.title}</div>
                  <div className="mt-1 text-sm text-[#F4F5F7]/60">{job.location?.city || job.location?.country || "Flexible"}</div>
                </Link>
              ))}
            </div>
          )}
        </ProfileSection>
      )}
    </>
  );
}

function AgencyProfile({ profile }: { profile: PublicProfile }) {
  const agency = profile.fields.agencyProfile;
  return (
    <>
      <ProfileSection title="Agency Services">
        <Fact label="About" value={agency?.description || profile.fields.bio} />
        <TagList tags={agency?.services ?? []} />
      </ProfileSection>
      <ProfileSection title="Markets & Proof">
        <TagList tags={[...(agency?.specialties ?? []), ...(agency?.industries ?? []), ...(agency?.clientTypes ?? [])]} />
        <Fact label="Success metrics" value={agency?.successMetrics} />
        <TagList tags={agency?.featuredPlacements ?? []} empty="No public placements yet." />
      </ProfileSection>
      <ProfileSection title="Featured Talent">
        {(profile.fields.approvedTalentRoster ?? []).length === 0 ? (
          <p className="text-[#F4F5F7]/50">No approved public talent roster yet.</p>
        ) : (
          <div className="grid gap-3 sm:grid-cols-2">
            {(profile.fields.approvedTalentRoster ?? []).map((member) => (
              <Link key={member.uid} href={`/talent/${member.slug || member.uid}`} className="rounded-lg border border-white/10 bg-[#1A1D20] p-4 hover:border-[#E5B536]/60">
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-white/5">
                    {member.photoURL ? <img src={member.photoURL} alt="" className="h-full w-full object-cover" /> : <Sparkles className="h-4 w-4 text-[#E5B536]" />}
                  </div>
                  <div>
                    <div className="font-semibold text-white">{member.displayName}</div>
                    <div className="text-sm text-[#F4F5F7]/60">{member.headline}</div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}
      </ProfileSection>
    </>
  );
}

function ProfileSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#262A2E]/70 p-6">
      <h2 className="mb-4 text-xl font-bold text-white">{title}</h2>
      <div className="space-y-3 text-[#F4F5F7]/75">{children}</div>
    </section>
  );
}

function Fact({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null;
  return (
    <div>
      <div className="text-sm text-[#F4F5F7]/45">{label}</div>
      <div className="whitespace-pre-wrap">{value}</div>
    </div>
  );
}

function TagList({ tags, empty = "No public details yet." }: { tags: string[]; empty?: string }) {
  if (tags.length === 0) return <p className="text-[#F4F5F7]/50">{empty}</p>;
  return (
    <div className="flex flex-wrap gap-2">
      {tags.map((tag) => (
        <span key={tag} className="rounded-lg border border-white/10 bg-[#1A1D20] px-3 py-1 text-sm text-[#F4F5F7]/75">
          {tag}
        </span>
      ))}
    </div>
  );
}

function InlineFact({ icon, value }: { icon: ReactNode; value: string }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1">
      {icon}
      {value}
    </span>
  );
}

function ExternalLinkRow({ href, label, compact = false, icon }: { href: string; label: string; compact?: boolean; icon?: ReactNode }) {
  const normalizedHref = href.startsWith("http") ? href : `https://${href}`;
  const className = compact
    ? "inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-[#E5B536] hover:text-[#5DC99B]"
    : "inline-flex items-center gap-2 text-[#E5B536] hover:text-[#5DC99B]";
  return (
    <a href={normalizedHref} target="_blank" rel="noopener noreferrer" className={className}>
      {icon}
      {label}
      {!icon && <ExternalLink className="h-4 w-4" />}
    </a>
  );
}
