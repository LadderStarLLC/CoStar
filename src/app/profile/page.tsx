"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { updateProfile } from "firebase/auth";
import { AlertCircle, CheckCircle2, Eye, EyeOff, Loader2, Save, Upload, UserRound } from "lucide-react";
import NavHeader from "@/components/NavHeader";
import PublicProfileView from "@/components/PublicProfileView";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import { uploadProfileImage, uploadResume } from "@/lib/storage";
import { fetchWalletSummary } from "@/lib/walletClient";
import { walletLabel, type WalletSummary } from "@/lib/wallet";
import {
  accountTypeLabels,
  buildPublicFieldsFromPrivate,
  defaultPublicVisibility,
  filterPublishedFields,
  getProfileDisplayName,
  getPublicProfilePath,
  getUserProfile,
  hidePublicProfile,
  isPublicAccountType,
  isPrivilegedAccountType,
  publishPublicProfile,
  savePublicProfileDraft,
  saveTypeSpecificProfile,
  type PublicFieldVisibility,
  type PublicProfile,
  type PublicProfileFields,
  type UserProfile,
} from "@/lib/profile";

export default function ProfilePage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [publishing, setPublishing] = useState(false);
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [displayName, setDisplayName] = useState("");
  const [photoURL, setPhotoURL] = useState<string | null>(null);
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [website, setWebsite] = useState("");
  const [searchable, setSearchable] = useState(true);
  const [visibility, setVisibility] = useState<PublicFieldVisibility>({});

  const [skills, setSkills] = useState("");
  const [portfolioLinks, setPortfolioLinks] = useState("");
  const [certifications, setCertifications] = useState("");
  const [availability, setAvailability] = useState("");
  const [desiredRoles, setDesiredRoles] = useState("");
  const [salaryExpectations, setSalaryExpectations] = useState("");
  const [relocation, setRelocation] = useState("");
  const [remotePreference, setRemotePreference] = useState("");
  const [resumeUrl, setResumeUrl] = useState("");
  const [resumeName, setResumeName] = useState("");

  const [companySize, setCompanySize] = useState("1-10");
  const [companyDescription, setCompanyDescription] = useState("");
  const [industry, setIndustry] = useState("");
  const [hiringGoals, setHiringGoals] = useState("");
  const [benefits, setBenefits] = useState("");
  const [cultureValues, setCultureValues] = useState("");
  const [cultureTags, setCultureTags] = useState("");
  const [showActiveJobsOnProfile, setShowActiveJobsOnProfile] = useState(false);
  const [billingContact, setBillingContact] = useState("");
  const [candidatePipeline, setCandidatePipeline] = useState("");
  const [businessNotes, setBusinessNotes] = useState("");

  const [agencyDescription, setAgencyDescription] = useState("");
  const [agencyServices, setAgencyServices] = useState("");
  const [agencySpecialties, setAgencySpecialties] = useState("");
  const [agencyIndustries, setAgencyIndustries] = useState("");
  const [clientTypes, setClientTypes] = useState("");
  const [successMetrics, setSuccessMetrics] = useState("");
  const [featuredPlacements, setFeaturedPlacements] = useState("");
  const [clientNotes, setClientNotes] = useState("");
  const [representedTalentNotes, setRepresentedTalentNotes] = useState("");
  const [agencyPipeline, setAgencyPipeline] = useState("");

  useEffect(() => {
    if (!authLoading && !user) router.push("/sign-in");
    if (!authLoading && user && isPrivilegedAccountType(user.accountType)) router.push("/account");
  }, [authLoading, user, router]);

  useEffect(() => {
    async function load() {
      if (!user) return;
      setLoading(true);
      try {
        const next = await getUserProfile(user.uid);
        if (!next?.accountType) {
          router.push("/onboarding");
          return;
        }
        setProfile(next);
        hydrate(next);
        
        try {
          const ws = await fetchWalletSummary(user);
          setWalletSummary(ws);
        } catch (e) {
          console.error("Failed to load wallet", e);
        }
      } catch (err) {
        console.error(err);
        setError("Could not load your profile.");
      } finally {
        setLoading(false);
      }
    }
    if (!authLoading) load();
  }, [authLoading, user, router]);

  const accountType = profile?.accountType ?? null;
  const publicAccountType = isPublicAccountType(accountType) ? accountType : null;

  const draftFields = profile && publicAccountType ? buildFields() : null;

  const previewProfile = useMemo<PublicProfile | null>(() => {
    if (!profile || !publicAccountType || !draftFields) return null;
    return {
      uid: profile.uid,
      accountType: publicAccountType,
      slug: profile.slug || profile.uid,
      status: "published",
      searchable,
      moderationStatus: profile.moderationStatus ?? "active",
      visibility,
      fields: filterPublishedFields(draftFields, { ...visibility, displayName: true }),
    };
  }, [profile, publicAccountType, draftFields, searchable, visibility]);

  function hydrate(next: UserProfile) {
    const fields = next.publicDraft?.fields ?? buildPublicFieldsFromPrivate(next);
    const nextVisibility = {
      ...defaultPublicVisibility(next.accountType),
      ...(next.publicDraft?.visibility ?? {}),
      displayName: true,
    };
    setVisibility(nextVisibility);
    setSearchable(next.publicDraft?.searchable ?? next.publicProfileEnabled ?? true);
    setDisplayName(getProfileDisplayName(next));
    setPhotoURL(fields.photoURL ?? next.photoURL ?? null);
    setHeadline(fields.headline ?? next.headline ?? "");
    setLocation(fields.location ?? next.location ?? "");
    setEmail(fields.email ?? next.email ?? "");
    setPhone(fields.phone ?? next.privateProfile?.phone ?? "");
    setBio(fields.bio ?? next.talentProfile?.bio ?? "");
    setWebsite(fields.website ?? next.businessProfile?.website ?? next.agencyProfile?.website ?? "");

    const talent = fields.talentProfile ?? next.talentProfile;
    setSkills((talent?.skills ?? []).join(", "));
    setPortfolioLinks((talent?.portfolioLinks ?? []).map((link) => `${link.label}|${link.url}`).join("\n"));
    setCertifications((talent?.certifications ?? []).join(", "));
    setAvailability(talent?.availability ?? "");
    setDesiredRoles((talent?.desiredRoles ?? []).join(", "));
    setSalaryExpectations(talent?.salaryExpectations ?? "");
    setRelocation(talent?.relocation ?? "");
    setRemotePreference(talent?.remotePreference ?? "");
    setResumeUrl(talent?.resume?.url ?? "");
    setResumeName(talent?.resume?.name ?? "");

    const business = fields.businessProfile ?? next.businessProfile;
    setCompanySize(business?.companySize ?? "1-10");
    setCompanyDescription(business?.description ?? "");
    setIndustry(business?.industry ?? "");
    setHiringGoals(business?.hiringGoals ?? "");
    setBenefits((business?.benefits ?? []).join(", "));
    setCultureValues(business?.culture?.values ?? "");
    setCultureTags((business?.culture?.tags ?? []).join(", "));
    setShowActiveJobsOnProfile(Boolean(business?.showActiveJobsOnProfile ?? fields.showActiveJobsOnProfile));
    setBillingContact(next.privateProfile?.businessCrm?.billingContact ?? "");
    setCandidatePipeline((next.privateProfile?.businessCrm?.candidatePipeline ?? []).join(", "));
    setBusinessNotes(next.privateProfile?.businessCrm?.notes ?? "");

    const agency = fields.agencyProfile ?? next.agencyProfile;
    setAgencyDescription(agency?.description ?? "");
    setAgencyServices((agency?.services ?? []).join(", "));
    setAgencySpecialties((agency?.specialties ?? []).join(", "));
    setAgencyIndustries((agency?.industries ?? []).join(", "));
    setClientTypes((agency?.clientTypes ?? []).join(", "));
    setSuccessMetrics(agency?.successMetrics ?? "");
    setFeaturedPlacements((agency?.featuredPlacements ?? []).join(", "));
    setClientNotes(next.privateProfile?.agencyCrm?.clientNotes ?? "");
    setRepresentedTalentNotes(next.privateProfile?.agencyCrm?.representedTalentNotes ?? "");
    setAgencyPipeline((next.privateProfile?.agencyCrm?.pipeline ?? []).join(", "));
  }

  function buildFields(): PublicProfileFields {
    return {
      displayName,
      photoURL,
      headline,
      location,
      email,
      phone,
      website,
      bio,
      workVibe: profile?.workVibe ?? null,
      socialConnections: profile?.socialConnections ?? [],
      talentProfile: publicAccountType === "talent" ? {
        bio,
        phone,
        skills: splitCsv(skills),
        portfolioLinks: splitLinks(portfolioLinks),
        resume: resumeUrl ? { url: resumeUrl, name: resumeName || "Resume" } : null,
        certifications: splitCsv(certifications),
        availability,
        desiredRoles: splitCsv(desiredRoles),
        salaryExpectations,
        relocation,
        remotePreference,
      } : null,
      businessProfile: publicAccountType === "business" ? {
        ...(profile?.businessProfile ?? {}),
        companyName: displayName,
        website,
        companySize,
        description: companyDescription,
        headquarters: { city: location },
        industry,
        hiringGoals,
        benefits: splitCsv(benefits),
        culture: { values: cultureValues, tags: splitCsv(cultureTags) },
        showActiveJobsOnProfile,
      } : null,
      agencyProfile: publicAccountType === "agency" ? {
        ...(profile?.agencyProfile ?? {}),
        agencyName: displayName,
        website,
        description: agencyDescription,
        location,
        services: splitCsv(agencyServices),
        specialties: splitCsv(agencySpecialties),
        industries: splitCsv(agencyIndustries),
        clientTypes: splitCsv(clientTypes),
        successMetrics,
        featuredPlacements: splitCsv(featuredPlacements),
      } : null,
      showActiveJobsOnProfile,
      approvedTalentRoster: profile?.publicDraft?.fields?.approvedTalentRoster ?? [],
    };
  }

  async function saveDraft() {
    if (!user || !profile || !publicAccountType || !draftFields) return;
    setSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (auth?.currentUser && displayName && displayName !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName, photoURL: photoURL ?? undefined });
      }

      await saveTypeSpecificProfile(user.uid, publicAccountType, {
        uid: user.uid,
        email,
        displayName,
        photoURL,
        headline,
        location,
        privateProfile: {
          phone,
          contactEmail: email,
          businessCrm: { billingContact, candidatePipeline: splitCsv(candidatePipeline), notes: businessNotes },
          agencyCrm: { clientNotes, representedTalentNotes, pipeline: splitCsv(agencyPipeline) },
        },
        talentProfile: draftFields.talentProfile,
        businessProfile: draftFields.businessProfile,
        agencyProfile: draftFields.agencyProfile,
      });
      await savePublicProfileDraft(user.uid, { fields: draftFields, visibility: { ...visibility, displayName: true }, searchable });
      const refreshed = await getUserProfile(user.uid);
      if (refreshed) {
        setProfile(refreshed);
        hydrate(refreshed);
      }
      setMessage("Draft saved.");
    } catch (err) {
      console.error(err);
      setError("Could not save your profile draft.");
    } finally {
      setSaving(false);
    }
  }

  async function publish() {
    if (!user) return;
    setPublishing(true);
    setError(null);
    setMessage(null);
    try {
      await saveDraft();
      await publishPublicProfile(user.uid);
      const refreshed = await getUserProfile(user.uid);
      if (refreshed) {
        setProfile(refreshed);
        hydrate(refreshed);
      }
      setMessage("Public profile published.");
    } catch (err) {
      console.error(err);
      setError("Could not publish your profile.");
    } finally {
      setPublishing(false);
    }
  }

  async function hideProfile() {
    if (!user) return;
    setPublishing(true);
    try {
      await hidePublicProfile(user.uid);
      setSearchable(false);
      setMessage("Public profile hidden.");
    } catch (err) {
      console.error(err);
      setError("Could not hide your public profile.");
    } finally {
      setPublishing(false);
    }
  }

  async function handleImageUpload(file?: File) {
    if (!file || !user) return;
    setSaving(true);
    try {
      const url = await uploadProfileImage(user.uid, file);
      setPhotoURL(url);
      setMessage("Image uploaded. Save or publish to apply it.");
    } catch (err: any) {
      setError(err?.message ?? "Could not upload image.");
    } finally {
      setSaving(false);
    }
  }

  async function handleResumeUpload(file?: File) {
    if (!file || !user) return;
    setSaving(true);
    try {
      const result = await uploadResume(user.uid, file);
      setResumeUrl(result.url);
      setResumeName(file.name);
      setMessage("Resume uploaded. Save or publish to apply it.");
    } catch (err: any) {
      setError(err?.message ?? "Could not upload resume.");
    } finally {
      setSaving(false);
    }
  }

  if (authLoading || loading) {
    return <ProfileLoadingShell />;
  }

  if (!profile || !publicAccountType) return null;

  if (mode === "preview" && previewProfile) {
    return (
      <div>
        <div className="sticky top-0 z-[60] border-b border-white/10 bg-[#1A1D20] px-6 py-3">
          <div className="mx-auto flex max-w-6xl items-center justify-between gap-3">
            <span className="text-sm text-[#F4F5F7]/70">Previewing your unpublished public draft</span>
            <button onClick={() => setMode("edit")} className="rounded-lg bg-[#E5B536] px-4 py-2 font-semibold text-[#1A1D20]">Back to editor</button>
          </div>
        </div>
        <PublicProfileView profile={previewProfile} preview />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1D20]">
      <NavHeader />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <div className="flex items-center gap-4">
              <p className="text-sm font-semibold uppercase tracking-wide text-[#E5B536]">{accountTypeLabels[publicAccountType]} profile</p>
              {walletSummary?.wallet && (
                <div className="flex items-center gap-1.5 rounded-full border border-[#E5B536]/30 bg-[#E5B536]/10 px-3 py-1 text-xs font-semibold text-[#E5B536]">
                  <span>{walletSummary.wallet.balance}</span>
                  <span className="opacity-70">{walletLabel(walletSummary.wallet.currency)}</span>
                </div>
              )}
            </div>
            <h1 className="mt-2 text-3xl font-bold text-white">Profile workspace</h1>
            <p className="mt-2 text-[#F4F5F7]/60">Private information stays private. Toggle individual fields, preview, then publish.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <button onClick={saveDraft} disabled={saving || publishing} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#262A2E] px-4 py-2 font-semibold text-white hover:border-[#5DC99B] disabled:opacity-60">
              {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : <Save className="h-4 w-4" />}
              Save draft
            </button>
            <button onClick={() => setMode("preview")} className="inline-flex items-center gap-2 rounded-lg border border-white/10 bg-[#262A2E] px-4 py-2 font-semibold text-white hover:border-[#E5B536]">
              <Eye className="h-4 w-4" />
              Preview
            </button>
            <button onClick={publish} disabled={publishing || saving} className="rounded-lg bg-[#E5B536] px-4 py-2 font-bold text-[#1A1D20] disabled:opacity-60">
              {publishing ? "Publishing..." : "Publish changes"}
            </button>
          </div>
        </div>

        {(message || error) && (
          <div className={`mb-6 flex items-center gap-3 rounded-lg border p-4 ${error ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-[#5DC99B]/30 bg-[#5DC99B]/10 text-[#5DC99B]"}`}>
            {error ? <AlertCircle className="h-5 w-5" /> : <CheckCircle2 className="h-5 w-5" />}
            {error || message}
          </div>
        )}

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            <Panel title="Identity">
              <div className="flex flex-col gap-5 sm:flex-row">
                <div className="flex h-24 w-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-white/10 bg-[#1A1D20]">
                  {photoURL ? <img src={photoURL} alt="" className="h-full w-full object-cover" /> : <UserRound className="h-10 w-10 text-[#F4F5F7]/40" />}
                </div>
                <div className="flex-1">
                  <label className="inline-flex cursor-pointer items-center gap-2 rounded-lg border border-white/10 bg-[#1A1D20] px-4 py-2 font-semibold text-white hover:border-[#5DC99B]">
                    <Upload className="h-4 w-4" />
                    Upload profile image
                    <input type="file" accept="image/*" className="hidden" onChange={(event) => handleImageUpload(event.target.files?.[0])} />
                  </label>
                  <p className="mt-2 text-sm text-[#F4F5F7]/50">Max 10MB. Public only when its visibility toggle is enabled.</p>
                </div>
              </div>
              <Field label="Name" value={displayName} onChange={setDisplayName} lockedPublic />
              <Field label="Headline" value={headline} onChange={setHeadline} fieldKey="headline" visibility={visibility} setVisibility={setVisibility} />
              <Field label="Location" value={location} onChange={setLocation} fieldKey="location" visibility={visibility} setVisibility={setVisibility} />
              <Field label="Email" value={email} onChange={setEmail} fieldKey="email" visibility={visibility} setVisibility={setVisibility} />
              <Field label="Phone" value={phone} onChange={setPhone} fieldKey="phone" visibility={visibility} setVisibility={setVisibility} />
              <Field label="Website" value={website} onChange={setWebsite} fieldKey="website" visibility={visibility} setVisibility={setVisibility} />
              <VisibilityRow label="Profile image" fieldKey="photoURL" visibility={visibility} setVisibility={setVisibility} />
            </Panel>

            {publicAccountType === "talent" && (
              <Panel title="Talent profile">
                <TextArea label="Bio" value={bio} onChange={setBio} fieldKey="bio" visibility={visibility} setVisibility={setVisibility} />
                <Field label="Skills" value={skills} onChange={setSkills} fieldKey="skills" visibility={visibility} setVisibility={setVisibility} placeholder="React, Sales, Production" />
                <TextArea label="Portfolio links" value={portfolioLinks} onChange={setPortfolioLinks} fieldKey="portfolioLinks" visibility={visibility} setVisibility={setVisibility} placeholder={"Portfolio|https://example.com\nGitHub|https://github.com/name"} />
                <Field label="Certifications" value={certifications} onChange={setCertifications} fieldKey="certifications" visibility={visibility} setVisibility={setVisibility} />
                <Field label="Availability" value={availability} onChange={setAvailability} fieldKey="availability" visibility={visibility} setVisibility={setVisibility} />
                <Field label="Desired roles" value={desiredRoles} onChange={setDesiredRoles} fieldKey="desiredRoles" visibility={visibility} setVisibility={setVisibility} />
                <Field label="Salary expectations" value={salaryExpectations} onChange={setSalaryExpectations} fieldKey="salaryExpectations" visibility={visibility} setVisibility={setVisibility} />
                <Field label="Relocation" value={relocation} onChange={setRelocation} fieldKey="relocation" visibility={visibility} setVisibility={setVisibility} />
                <Field label="Remote preference" value={remotePreference} onChange={setRemotePreference} fieldKey="remotePreference" visibility={visibility} setVisibility={setVisibility} />
                <div className="rounded-lg border border-white/10 bg-[#1A1D20] p-4">
                  <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                    <div>
                      <div className="font-semibold text-white">Resume</div>
                      <div className="text-sm text-[#F4F5F7]/50">{resumeName || "PDF, max 5MB"}</div>
                    </div>
                    <div className="flex items-center gap-3">
                      <VisibilityToggle fieldKey="resume" visibility={visibility} setVisibility={setVisibility} />
                      <label className="cursor-pointer rounded-lg bg-[#262A2E] px-4 py-2 text-sm font-semibold text-white hover:bg-white/10">
                        Upload PDF
                        <input type="file" accept="application/pdf" className="hidden" onChange={(event) => handleResumeUpload(event.target.files?.[0])} />
                      </label>
                    </div>
                  </div>
                </div>
              </Panel>
            )}

            {publicAccountType === "business" && (
              <Panel title="Business profile">
                <TextArea label="Company description" value={companyDescription} onChange={setCompanyDescription} fieldKey="bio" visibility={visibility} setVisibility={setVisibility} />
                <Field label="Industry" value={industry} onChange={setIndustry} fieldKey="industry" visibility={visibility} setVisibility={setVisibility} />
                <Field label="Company size" value={companySize} onChange={setCompanySize} fieldKey="companySize" visibility={visibility} setVisibility={setVisibility} />
                <Field label="Hiring goals" value={hiringGoals} onChange={setHiringGoals} fieldKey="hiringGoals" visibility={visibility} setVisibility={setVisibility} />
                <Field label="Benefits" value={benefits} onChange={setBenefits} fieldKey="benefits" visibility={visibility} setVisibility={setVisibility} />
                <Field label="Culture values" value={cultureValues} onChange={setCultureValues} fieldKey="culture" visibility={visibility} setVisibility={setVisibility} />
                <Field label="Culture tags" value={cultureTags} onChange={setCultureTags} fieldKey="culture" visibility={visibility} setVisibility={setVisibility} />
                <ToggleLine label="Show active jobs on public profile" checked={showActiveJobsOnProfile} onChange={setShowActiveJobsOnProfile} fieldKey="activeJobs" visibility={visibility} setVisibility={setVisibility} />
              </Panel>
            )}

            {publicAccountType === "agency" && (
              <Panel title="Agency profile">
                <TextArea label="Agency description" value={agencyDescription} onChange={setAgencyDescription} fieldKey="bio" visibility={visibility} setVisibility={setVisibility} />
                <Field label="Services" value={agencyServices} onChange={setAgencyServices} fieldKey="services" visibility={visibility} setVisibility={setVisibility} />
                <Field label="Specialties" value={agencySpecialties} onChange={setAgencySpecialties} fieldKey="specialties" visibility={visibility} setVisibility={setVisibility} />
                <Field label="Industries" value={agencyIndustries} onChange={setAgencyIndustries} fieldKey="industries" visibility={visibility} setVisibility={setVisibility} />
                <Field label="Client types" value={clientTypes} onChange={setClientTypes} fieldKey="clientTypes" visibility={visibility} setVisibility={setVisibility} />
                <Field label="Success metrics" value={successMetrics} onChange={setSuccessMetrics} fieldKey="successMetrics" visibility={visibility} setVisibility={setVisibility} />
                <Field label="Featured placements" value={featuredPlacements} onChange={setFeaturedPlacements} fieldKey="featuredPlacements" visibility={visibility} setVisibility={setVisibility} />
                <VisibilityRow label="Approved talent roster" fieldKey="talentRoster" visibility={visibility} setVisibility={setVisibility} />
              </Panel>
            )}

            <Panel title="Private CRM notes">
              {publicAccountType === "business" ? (
                <>
                  <Field label="Billing contact" value={billingContact} onChange={setBillingContact} />
                  <Field label="Candidate pipeline" value={candidatePipeline} onChange={setCandidatePipeline} />
                  <TextArea label="Private notes" value={businessNotes} onChange={setBusinessNotes} />
                </>
              ) : publicAccountType === "agency" ? (
                <>
                  <TextArea label="Client notes" value={clientNotes} onChange={setClientNotes} />
                  <TextArea label="Represented talent notes" value={representedTalentNotes} onChange={setRepresentedTalentNotes} />
                  <Field label="Pipeline" value={agencyPipeline} onChange={setAgencyPipeline} />
                </>
              ) : (
                <p className="text-[#F4F5F7]/60">Talent CRM fields will be connected to applications and saved jobs later.</p>
              )}
            </Panel>
          </div>

          <aside className="space-y-6">
            <Panel title="Publishing">
              <ToggleLine label="Searchable when published" checked={searchable} onChange={setSearchable} />
              <div className="rounded-lg border border-white/10 bg-[#1A1D20] p-4 text-sm text-[#F4F5F7]/60">
                Public page: {profile.slug ? (
                  <a className="text-[#E5B536] hover:text-[#5DC99B]" href={getPublicProfilePath(publicAccountType, profile.slug)} target="_blank">
                    {getPublicProfilePath(publicAccountType, profile.slug)}
                  </a>
                ) : "Publish to create URL"}
              </div>
              {profile?.publicProfileEnabled === false ? (
                <button onClick={publish} disabled={publishing} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-[#5DC99B]/30 bg-[#5DC99B]/10 px-4 py-2 font-semibold text-[#5DC99B] disabled:opacity-60">
                  <Eye className="h-4 w-4" />
                  Show public profile
                </button>
              ) : (
                <button onClick={hideProfile} disabled={publishing} className="inline-flex w-full items-center justify-center gap-2 rounded-lg border border-red-500/30 bg-red-500/10 px-4 py-2 font-semibold text-red-300 disabled:opacity-60">
                  <EyeOff className="h-4 w-4" />
                  Hide public profile
                </button>
              )}
            </Panel>
          </aside>
        </div>
      </main>
    </div>
  );
}

function ProfileLoadingShell() {
  return (
    <div className="min-h-screen bg-[#1A1D20]">
      <NavHeader />
      <main className="mx-auto max-w-6xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div className="min-w-0 flex-1">
            <div className="mb-3 h-5 w-56 rounded bg-white/10" />
            <div className="mb-3 h-9 w-72 rounded bg-white/10" />
            <div className="h-5 w-full max-w-lg rounded bg-white/10" />
          </div>
          <div className="flex gap-2">
            <div className="h-10 w-32 rounded-lg bg-white/10" />
            <div className="h-10 w-24 rounded-lg bg-white/10" />
            <div className="h-10 w-36 rounded-lg bg-white/10" />
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
          <div className="space-y-6">
            {Array.from({ length: 3 }).map((_, index) => (
              <section key={index} className="min-h-[286px] rounded-lg border border-white/10 bg-[#262A2E]/70 p-6">
                <div className="mb-5 h-7 w-44 rounded bg-white/10" />
                <div className="space-y-4">
                  <div className="h-12 rounded-lg bg-[#1A1D20]" />
                  <div className="h-12 rounded-lg bg-[#1A1D20]" />
                  <div className="h-12 rounded-lg bg-[#1A1D20]" />
                </div>
              </section>
            ))}
          </div>
          <aside>
            <section className="min-h-[210px] rounded-lg border border-white/10 bg-[#262A2E]/70 p-6">
              <div className="mb-5 h-7 w-32 rounded bg-white/10" />
              <div className="space-y-4">
                <div className="h-12 rounded-lg bg-[#1A1D20]" />
                <div className="h-20 rounded-lg bg-[#1A1D20]" />
                <div className="h-10 rounded-lg bg-white/10" />
              </div>
            </section>
          </aside>
        </div>
      </main>
    </div>
  );
}

function Panel({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-lg border border-white/10 bg-[#262A2E]/70 p-6">
      <h2 className="mb-5 text-xl font-bold text-white">{title}</h2>
      <div className="space-y-4">{children}</div>
    </section>
  );
}

function Field(props: { label: string; value: string; onChange: (value: string) => void; fieldKey?: string; visibility?: PublicFieldVisibility; setVisibility?: (value: PublicFieldVisibility) => void; placeholder?: string; lockedPublic?: boolean }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[180px_1fr_auto] sm:items-center">
      <label className="font-medium text-white">{props.label}</label>
      <input value={props.value} onChange={(event) => props.onChange(event.target.value)} placeholder={props.placeholder} className="w-full rounded-lg border border-white/10 bg-[#1A1D20] px-4 py-3 text-white placeholder:text-[#F4F5F7]/30 focus:border-[#E5B536] focus:outline-none" />
      {props.lockedPublic ? <span className="text-xs text-[#5DC99B]">Always public</span> : props.fieldKey && props.visibility && props.setVisibility ? <VisibilityToggle fieldKey={props.fieldKey} visibility={props.visibility} setVisibility={props.setVisibility} /> : <span />}
    </div>
  );
}

function TextArea(props: { label: string; value: string; onChange: (value: string) => void; fieldKey?: string; visibility?: PublicFieldVisibility; setVisibility?: (value: PublicFieldVisibility) => void; placeholder?: string }) {
  return (
    <div className="grid gap-2 sm:grid-cols-[180px_1fr_auto] sm:items-start">
      <label className="pt-3 font-medium text-white">{props.label}</label>
      <textarea rows={4} value={props.value} onChange={(event) => props.onChange(event.target.value)} placeholder={props.placeholder} className="w-full resize-y rounded-lg border border-white/10 bg-[#1A1D20] px-4 py-3 text-white placeholder:text-[#F4F5F7]/30 focus:border-[#E5B536] focus:outline-none" />
      {props.fieldKey && props.visibility && props.setVisibility ? <VisibilityToggle fieldKey={props.fieldKey} visibility={props.visibility} setVisibility={props.setVisibility} /> : <span />}
    </div>
  );
}

function VisibilityRow(props: { label: string; fieldKey: string; visibility: PublicFieldVisibility; setVisibility: (value: PublicFieldVisibility) => void }) {
  return (
    <div className="flex items-center justify-between rounded-lg border border-white/10 bg-[#1A1D20] p-4">
      <span className="font-medium text-white">{props.label}</span>
      <VisibilityToggle fieldKey={props.fieldKey} visibility={props.visibility} setVisibility={props.setVisibility} />
    </div>
  );
}

function VisibilityToggle({ fieldKey, visibility, setVisibility }: { fieldKey: string; visibility: PublicFieldVisibility; setVisibility: (value: PublicFieldVisibility) => void }) {
  const checked = Boolean(visibility[fieldKey]);
  return (
    <button type="button" onClick={() => setVisibility({ ...visibility, [fieldKey]: !checked })} className={`inline-flex min-w-24 items-center justify-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold ${checked ? "bg-[#5DC99B] text-[#1A1D20]" : "bg-white/10 text-[#F4F5F7]/60"}`}>
      {checked ? <Eye className="h-4 w-4" /> : <EyeOff className="h-4 w-4" />}
      {checked ? "Public" : "Private"}
    </button>
  );
}

function ToggleLine(props: { label: string; checked: boolean; onChange: (value: boolean) => void; fieldKey?: string; visibility?: PublicFieldVisibility; setVisibility?: (value: PublicFieldVisibility) => void }) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-white/10 bg-[#1A1D20] p-4">
      <label className="font-medium text-white">{props.label}</label>
      <div className="flex items-center gap-3">
        <button type="button" onClick={() => props.onChange(!props.checked)} className={`rounded-lg px-3 py-2 text-sm font-semibold ${props.checked ? "bg-[#E5B536] text-[#1A1D20]" : "bg-white/10 text-[#F4F5F7]/60"}`}>
          {props.checked ? "On" : "Off"}
        </button>
        {props.fieldKey && props.visibility && props.setVisibility && <VisibilityToggle fieldKey={props.fieldKey} visibility={props.visibility} setVisibility={props.setVisibility} />}
      </div>
    </div>
  );
}

function splitCsv(value: string): string[] {
  return value.split(",").map((item) => item.trim()).filter(Boolean);
}

function splitLinks(value: string) {
  return value
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const [label, url] = line.includes("|") ? line.split("|") : [line, line];
      return { label: label.trim(), url: url.trim() };
    });
}
