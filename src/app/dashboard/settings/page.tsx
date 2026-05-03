"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { GithubAuthProvider, deleteUser, linkWithPopup, updateProfile } from "firebase/auth";
import { deleteDoc, doc } from "firebase/firestore";
import { Loader2, Save, Github, Linkedin, CheckCircle2, AlertCircle, Trash2, Camera, Palette, UserCog, Eye, Wallet, Lock, Shield } from "lucide-react";
import NavHeader from "@/components/NavHeader";
import { useAuth } from "@/context/AuthContext";
import { auth, db } from "@/lib/firebase";
import { uploadProfileImage } from "@/lib/storage";
import { fetchWalletSummary } from "@/lib/walletClient";
import { walletLabel, type WalletSummary } from "@/lib/wallet";
import {
  accountTypeLabels,
  appearanceSchemes,
  createSlug,
  generateUniqueSlug,
  emptyWorkVibe,
  getOperatorPreviewProfile,
  getSocialConnection,
  getUserProfile,
  isPrivilegedAccountType,
  publicAccountTypes,
  saveOperatorPreviewProfile,
  saveTypeSpecificProfile,
  saveUserManagedSettings,
  upsertSocialConnection,
  type AccountType,
  type AppearanceScheme,
  type PublicAccountType,
  type SocialConnection,
  type WorkVibe,
} from "@/lib/profile";

const appearanceLabels: Record<AppearanceScheme, { name: string; description: string; swatches: string[] }> = {
  ladderstar: {
    name: "LadderStar",
    description: "Charcoal surfaces with gold and emerald trim.",
    swatches: ["#1A1D20", "#262A2E", "#E5B536", "#5DC99B"],
  },
  light: {
    name: "Light",
    description: "Bright neutral surfaces with the same premium trim.",
    swatches: ["#F8FAFC", "#E2E8F0", "#D69E2E", "#168A63"],
  },
  midnight: {
    name: "Midnight",
    description: "Deeper graphite-blue surfaces with warmer contrast.",
    swatches: ["#0B1220", "#172033", "#F0C44C", "#64D6A3"],
  },
  "high-contrast": {
    name: "High Contrast",
    description: "Sharper contrast for denser reading and focus.",
    swatches: ["#050505", "#181818", "#FFD44D", "#00D084"],
  },
};

export default function AccountSettingsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const isOperator = isPrivilegedAccountType(user?.accountType);

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isConnectingGithub, setIsConnectingGithub] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [walletSummary, setWalletSummary] = useState<WalletSummary | null>(null);
  const [activeTab, setActiveTab] = useState<"account" | "profile" | "privacy" | "wallet" | "security">("account");

  const [accountType, setAccountType] = useState<AccountType | null>(null);
  const [previewType, setPreviewType] = useState<PublicAccountType>("talent");
  const [displayName, setDisplayName] = useState("");
  const [publicProfileEnabled, setPublicProfileEnabled] = useState(true);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [headline, setHeadline] = useState("");
  const [location, setLocation] = useState("");
  const [linkedInUrl, setLinkedInUrl] = useState("");
  const [socialConnections, setSocialConnections] = useState<SocialConnection[]>([]);
  const [workVibe, setWorkVibe] = useState<WorkVibe>(emptyWorkVibe);
  const [companyName, setCompanyName] = useState("");
  const [companyWebsite, setCompanyWebsite] = useState("");
  const [companySize, setCompanySize] = useState("1-10");
  const [companyDescription, setCompanyDescription] = useState("");
  const [hiringGoals, setHiringGoals] = useState("");
  const [agencyName, setAgencyName] = useState("");
  const [agencyWebsite, setAgencyWebsite] = useState("");
  const [agencyDescription, setAgencyDescription] = useState("");
  const [agencySpecialties, setAgencySpecialties] = useState("");
  const [agencyServices, setAgencyServices] = useState("");
  const [appearanceScheme, setAppearanceScheme] = useState<AppearanceScheme>("ladderstar");

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in");
    }
  }, [authLoading, user, router]);

  useEffect(() => {
    document.documentElement.dataset.theme = appearanceScheme;
  }, [appearanceScheme]);

  useEffect(() => {
    const loadProfile = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        const profile = isOperator
          ? await getOperatorPreviewProfile(user.uid, previewType, user)
          : await getUserProfile(user.uid);
        const operatorProfile = isOperator ? await getUserProfile(user.uid) : null;
        setAccountType(profile?.accountType ?? null);
        if (!isOperator && profile && !profile.accountType) {
          router.push("/onboarding");
          return;
        }
        setPublicProfileEnabled(profile?.publicProfileEnabled ?? true);
        setAppearanceScheme(operatorProfile?.appearanceScheme ?? profile?.appearanceScheme ?? "ladderstar");
        setDisplayName(profile?.displayName ?? user.displayName ?? "");
        setHeadline(profile?.headline ?? "");
        setLocation(profile?.location ?? "");
        setSocialConnections(profile?.socialConnections ?? []);
        setWorkVibe(profile?.workVibe ?? emptyWorkVibe);
        setLinkedInUrl(getSocialConnection(profile, "linkedin")?.url ?? "");
        setCompanyName(profile?.businessProfile?.companyName ?? "");
        setCompanyWebsite(profile?.businessProfile?.website ?? "");
        setCompanySize(profile?.businessProfile?.companySize ?? "1-10");
        setCompanyDescription(profile?.businessProfile?.description ?? "");
        setHiringGoals(profile?.businessProfile?.hiringGoals ?? "");
        setAgencyName(profile?.agencyProfile?.agencyName ?? "");
        setAgencyWebsite(profile?.agencyProfile?.website ?? "");
        setAgencyDescription(profile?.agencyProfile?.description ?? "");
        setAgencySpecialties((profile?.agencyProfile?.specialties ?? []).join(", "));
        setAgencyServices((profile?.agencyProfile?.services ?? []).join(", "));

        if (isOperator) {
          setWalletSummary(null);
        } else {
          const nextWalletSummary = await fetchWalletSummary(user);
          setWalletSummary(nextWalletSummary);
        }
      } catch (err) {
        console.error("Failed to load settings:", err);
        setError("Could not load your settings.");
      } finally {
        setIsLoading(false);
      }
    };

    if (!authLoading) {
      loadProfile();
    }
  }, [authLoading, user, isOperator, previewType, router]);

  const githubConnection = getSocialConnection({ socialConnections }, "github");
  const linkedInConnection = getSocialConnection({ socialConnections }, "linkedin");
  const tabs = [
    { id: "account", label: "Account", icon: UserCog },
    { id: "profile", label: "Profile", icon: Save },
    { id: "privacy", label: "Privacy", icon: Eye },
    { id: "wallet", label: "Wallet", icon: Wallet },
    { id: "security", label: "Security", icon: Lock },
  ] as const;

  const saveProfile = async (nextConnections = socialConnections) => {
    if (!user) return;

    setIsSaving(true);
    setError(null);
    setMessage(null);

    try {
      const trimmedName = displayName.trim();
      if (auth?.currentUser && trimmedName && trimmedName !== auth.currentUser.displayName) {
        await updateProfile(auth.currentUser, { displayName: trimmedName });
      }

      if (!accountType) {
        setError("Choose your account type in onboarding before saving settings.");
        return;
      }

      const slug = await generateUniqueSlug(
        accountType === "business" ? companyName : accountType === "agency" ? agencyName : trimmedName,
        user.uid
      );

      const profileUpdates = {
        uid: user.uid,
        email: user.email,
        displayName: trimmedName || user.displayName,
        photoURL: user.photoURL,
        publicProfileEnabled,
        appearanceScheme,
        slug,
        headline: headline.trim(),
        location: location.trim(),
        socialConnections: nextConnections,
        workVibe: accountType === "talent" ? workVibe : emptyWorkVibe,
        businessProfile: accountType === "business" ? {
          companyName: companyName.trim(),
          website: companyWebsite.trim(),
          companySize,
          description: companyDescription.trim(),
          headquarters: { city: location.trim() },
          hiringGoals: hiringGoals.trim(),
          culture: {
            values: workVibe.values.trim(),
            tags: [...workVibe.style, ...workVibe.culture],
          },
        } : undefined,
        agencyProfile: accountType === "agency" ? {
          agencyName: agencyName.trim(),
          website: agencyWebsite.trim(),
          description: agencyDescription.trim(),
          location: location.trim(),
          specialties: splitCsv(agencySpecialties),
          services: splitCsv(agencyServices),
        } : undefined,
      };

      if (isOperator) {
        await saveOperatorPreviewProfile(user.uid, accountType as PublicAccountType, profileUpdates);
        await saveUserManagedSettings(user.uid, { appearanceScheme });
      } else {
        await saveTypeSpecificProfile(user.uid, accountType, profileUpdates);
      }
      setSocialConnections(nextConnections);
      setMessage(isOperator ? "Preview settings saved." : "Settings saved.");
    } catch (err) {
      console.error("Failed to save settings:", err);
      setError("Could not save settings. Check your connection and try again.");
    } finally {
      setIsSaving(false);
    }
  };

  const saveCurrentTab = async () => {
    if (!user) return;

    if (activeTab === "account" || activeTab === "privacy") {
      setIsSaving(true);
      setError(null);
      setMessage(null);

      try {
        await saveUserManagedSettings(
          user.uid,
          activeTab === "account" ? { appearanceScheme } : { publicProfileEnabled }
        );
        setMessage("Settings saved.");
      } catch (err) {
        console.error("Failed to save settings:", err);
        setError("Could not save settings. Check your connection and try again.");
      } finally {
        setIsSaving(false);
      }
      return;
    }

    await saveProfile();
  };

  const connectGithub = async () => {
    if (!auth?.currentUser || !user) {
      setError("Sign in again before connecting GitHub.");
      return;
    }

    setIsConnectingGithub(true);
    setError(null);
    setMessage(null);

    try {
      const provider = new GithubAuthProvider();
      provider.addScope("read:user");
      provider.addScope("user:email");

      const result = await linkWithPopup(auth.currentUser, provider);
      const githubProvider = result.user.providerData.find((providerData) => providerData.providerId === "github.com");
      const nextConnections = upsertSocialConnection(socialConnections, {
        platform: "github",
        id: githubProvider?.uid ?? result.user.uid,
        label: githubProvider?.displayName ?? "GitHub",
        url: githubProvider?.photoURL ?? undefined,
        connected: true,
        connectedAt: new Date().toISOString(),
      });

      await saveProfile(nextConnections);
      setMessage("GitHub connected.");
    } catch (err: any) {
      console.error("Failed to connect GitHub:", err);
      if (err?.code === "auth/provider-already-linked") {
        const nextConnections = upsertSocialConnection(socialConnections, {
          platform: "github",
          id: auth.currentUser.uid,
          label: "GitHub",
          connected: true,
          connectedAt: new Date().toISOString(),
        });
        await saveProfile(nextConnections);
        setMessage("GitHub was already linked.");
      } else if (err?.code === "auth/credential-already-in-use") {
        setError("That GitHub account is already linked to another LadderStar account.");
      } else {
        setError("Could not connect GitHub. Confirm GitHub is enabled in Firebase Auth.");
      }
    } finally {
      setIsConnectingGithub(false);
    }
  };

  const importLinkedIn = async () => {
    const trimmedUrl = linkedInUrl.trim();
    const normalizedUrl = trimmedUrl.startsWith("http") ? trimmedUrl : `https://${trimmedUrl}`;

    if (!trimmedUrl || !normalizedUrl.includes("linkedin.com/")) {
      setError("Enter a valid LinkedIn profile URL.");
      return;
    }

    const nextConnections = upsertSocialConnection(socialConnections, {
      platform: "linkedin",
      id: normalizedUrl,
      label: "LinkedIn profile",
      url: normalizedUrl,
      connected: true,
      connectedAt: new Date().toISOString(),
    });

    setLinkedInUrl(normalizedUrl);
    await saveProfile(nextConnections);
    setMessage("LinkedIn profile imported.");
  };

  const toggleWorkVibeValue = (field: "style" | "culture", value: string) => {
    setWorkVibe((current) => {
      const selected = current[field];
      return {
        ...current,
        [field]: selected.includes(value)
          ? selected.filter((item) => item !== value)
          : [...selected, value],
      };
    });
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !auth?.currentUser) return;
    
    setIsUploadingImage(true);
    setError(null);
    try {
      const url = await uploadProfileImage(user.uid, file);
      await updateProfile(auth.currentUser, { photoURL: url });
      setMessage("Profile image updated. Save settings to apply changes everywhere.");
    } catch (err) {
      console.error(err);
      setError("Failed to upload image.");
    } finally {
      setIsUploadingImage(false);
    }
  };

  const deleteAccount = async () => {
    if (!auth?.currentUser || !user || !db) {
      setError("Sign in again before deleting your account.");
      return;
    }

    const confirmed = window.confirm(
      "Delete this LadderStar account? This removes your profile and lets this email choose a new account type only after signing up again."
    );
    if (!confirmed) return;

    setIsDeleting(true);
    setError(null);
    setMessage(null);

    try {
      await deleteDoc(doc(db, "users", user.uid));
      await deleteUser(auth.currentUser);
      router.push("/");
    } catch (err: any) {
      console.error("Failed to delete account:", err);
      if (err?.code === "auth/requires-recent-login") {
        setError("Firebase requires a fresh sign-in before deleting this account. Sign out, sign back in, then try again.");
      } else {
        setError("Could not delete this account. Try again in a moment.");
      }
    } finally {
      setIsDeleting(false);
    }
  };

  if (authLoading || isLoading) {
    return <SettingsLoadingShell />;
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-900">
      <NavHeader />

      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">Account Settings</h1>
          <p className="text-slate-400">
            {isOperator
              ? "Edit private sandbox versions of each public account path."
              : "Manage your profile details and professional connections."}
          </p>
        </div>

        {isOperator && (
          <div className="mb-6 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
            <div className="mb-3 font-semibold text-amber-200">Preview account path</div>
            <div className="flex flex-wrap gap-2">
              {publicAccountTypes.map((type) => (
                <button
                  key={type}
                  onClick={() => setPreviewType(type)}
                  className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
                    previewType === type
                      ? "bg-amber-500 text-slate-900"
                      : "bg-slate-900 text-slate-300 hover:bg-white/10 hover:text-white"
                  }`}
                >
                  {accountTypeLabels[type]}
                </button>
              ))}
            </div>
          </div>
        )}

        {(message || error) && (
          <div
            className={`mb-6 border rounded-xl p-4 flex items-center gap-3 ${
              error
                ? "bg-red-500/10 border-red-500/30 text-red-300"
                : "bg-green-500/10 border-green-500/30 text-green-300"
            }`}
          >
            {error ? <AlertCircle className="w-5 h-5" /> : <CheckCircle2 className="w-5 h-5" />}
            <span>{error || message}</span>
          </div>
        )}

        <div className="mb-6 overflow-x-auto border-b border-white/10">
          <div className="flex min-w-max gap-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`inline-flex items-center gap-2 border-b-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  activeTab === tab.id
                    ? "border-[#E5B536] text-[#E5B536]"
                    : "border-transparent text-[#F4F5F7]/62 hover:text-[#5DC99B]"
                }`}
              >
                <tab.icon className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          {activeTab === "wallet" && walletSummary?.wallet && (
            <section className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <h2 className="text-xl font-bold text-white">Premium Balance</h2>
                  <p className="mt-1 text-sm text-slate-400">
                    Private to your account and managed by LadderStar.
                  </p>
                </div>
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-5 py-4 text-right">
                  <div className="text-3xl font-bold text-white">{walletSummary.wallet.balance}</div>
                  <div className="text-sm font-medium text-emerald-300">{walletLabel(walletSummary.wallet.currency)}</div>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="mb-3 text-sm font-semibold uppercase tracking-wide text-slate-400">Recent Activity</h3>
                {walletSummary.transactions.length > 0 ? (
                  <div className="divide-y divide-white/10 overflow-hidden rounded-xl border border-white/10">
                    {walletSummary.transactions.map((transaction) => (
                      <div key={transaction.id} className="flex items-center justify-between gap-4 bg-slate-900 px-4 py-3">
                        <div>
                          <div className="font-medium text-white">{transaction.reason}</div>
                          <div className="text-sm text-slate-500">{formatWalletDate(transaction.createdAt)}</div>
                        </div>
                        <div className={transaction.delta >= 0 ? "font-bold text-emerald-300" : "font-bold text-red-300"}>
                          {transaction.delta >= 0 ? "+" : ""}{transaction.delta}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="rounded-xl border border-white/10 bg-slate-900 px-4 py-3 text-slate-400">
                    No balance activity yet.
                  </p>
                )}
              </div>
            </section>
          )}

          {activeTab === "wallet" && !walletSummary?.wallet && (
            <section className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white">Premium Balance</h2>
              <p className="mt-2 text-slate-400">
                This account type does not currently use a premium wallet.
              </p>
            </section>
          )}

          {activeTab === "account" && (
          <section className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-xl font-bold text-white">Identity</h2>
              <div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-slate-900 px-3 py-1 text-sm text-slate-300">
                {isOperator ? <Shield className="h-4 w-4 text-amber-300" /> : <UserCog className="h-4 w-4 text-emerald-300" />}
                {accountType ? accountTypeLabels[accountType] : "Unassigned"}
              </div>
            </div>
            
            <div className="mb-6 flex items-center gap-4">
              <div className="h-20 w-20 shrink-0 overflow-hidden rounded-full border border-white/10 bg-slate-900 relative">
                {auth?.currentUser?.photoURL ? (
                  <img src={auth.currentUser.photoURL} alt="Avatar" className="w-full h-full object-cover" />
                ) : (
                  <Camera className="w-8 h-8 text-slate-500 absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2" />
                )}
              </div>
              <div>
                <label className="inline-flex cursor-pointer items-center justify-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-800">
                  {isUploadingImage && <Loader2 className="w-4 h-4 animate-spin" />}
                  Upload Image
                  <input type="file" accept="image/*" className="hidden" onChange={handleImageUpload} disabled={isUploadingImage} />
                </label>
              </div>
            </div>

            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <label className="block text-white mb-2 font-medium">Full Name</label>
                <input
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-white mb-2 font-medium">Account Type</label>
                <div className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white">
                  {accountType ? accountTypeLabels[accountType] : "Select in onboarding"}
                  <span className="ml-2 text-xs text-slate-500">Locked</span>
                </div>
              </div>
              <div>
                <label className="block text-white mb-2 font-medium">Headline</label>
                <input
                  value={headline}
                  onChange={(e) => setHeadline(e.target.value)}
                  placeholder="Senior Software Engineer"
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
              <div>
                <label className="block text-white mb-2 font-medium">Location</label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="San Francisco, CA"
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </section>
          )}

          {activeTab === "account" && (
          <section className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
            <div className="mb-6 flex items-center gap-3">
              <Palette className="h-5 w-5 text-amber-400" />
              <h2 className="text-xl font-bold text-white">Appearance</h2>
            </div>
            <div className="grid gap-3 md:grid-cols-2">
              {appearanceSchemes.map((scheme) => {
                const option = appearanceLabels[scheme];
                const selected = appearanceScheme === scheme;
                return (
                  <button
                    key={scheme}
                    type="button"
                    onClick={() => setAppearanceScheme(scheme)}
                    className={`min-h-[116px] rounded-xl border p-4 text-left transition-colors ${
                      selected
                        ? "border-amber-500/60 bg-amber-500/10"
                        : "border-white/10 bg-slate-900 hover:border-amber-500/40"
                    }`}
                    aria-pressed={selected}
                  >
                    <div className="flex items-start justify-between gap-3">
                      <div>
                        <div className="font-bold text-white">{option.name}</div>
                        <p className="mt-1 text-sm leading-6 text-slate-400">{option.description}</p>
                      </div>
                      <div className={`mt-1 h-4 w-4 rounded-full border ${selected ? "border-amber-400 bg-amber-400" : "border-white/20"}`} />
                    </div>
                    <div className="mt-4 flex gap-2">
                      {option.swatches.map((color) => (
                        <span
                          key={color}
                          className="h-6 w-10 rounded-md border border-white/10"
                          style={{ backgroundColor: color }}
                        />
                      ))}
                    </div>
                  </button>
                );
              })}
            </div>
          </section>
          )}

          {activeTab === "privacy" && (
          <section className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-2">Privacy</h2>
            <p className="mb-6 text-sm text-slate-400">
              Control whether your public profile can be shown. Detailed public field controls live on the Profile page.
            </p>
            <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-slate-900 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <div className="font-semibold text-white">Public profile visibility</div>
                <div className="text-sm text-slate-400">
                  {publicProfileEnabled ? "Your published profile can be visible and searchable." : "Your public profile is hidden."}
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <span className="text-sm font-medium text-slate-300">{publicProfileEnabled ? "Visible" : "Hidden"}</span>
                <div className="relative">
                  <input
                    type="checkbox"
                    checked={publicProfileEnabled}
                    onChange={(e) => setPublicProfileEnabled(e.target.checked)}
                    className="sr-only"
                  />
                  <div className={`block w-10 h-6 rounded-full transition-colors ${publicProfileEnabled ? 'bg-amber-500' : 'bg-slate-700'}`}></div>
                  <div className={`absolute left-1 top-1 w-4 h-4 rounded-full bg-white transition-transform ${publicProfileEnabled ? 'translate-x-4' : ''}`}></div>
                </div>
              </label>
            </div>
            <div className="mt-4 rounded-xl border border-white/10 bg-slate-900 p-4">
              <div className="font-semibold text-white">Public field controls</div>
              <p className="mt-1 text-sm text-slate-400">
                Use `/profile` to choose exactly which profile fields are published, then return here for account-wide controls.
              </p>
            </div>
          </section>
          )}

          {activeTab === "profile" && accountType === "business" && (
            <section className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Company Profile</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2 font-medium">Company Name</label>
                  <input
                    value={companyName}
                    onChange={(e) => setCompanyName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 font-medium">Website</label>
                  <input
                    value={companyWebsite}
                    onChange={(e) => setCompanyWebsite(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 font-medium">Company Size</label>
                  <select
                    value={companySize}
                    onChange={(e) => setCompanySize(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white focus:border-amber-500 focus:outline-none"
                  >
                    {["1-10", "11-50", "51-200", "201-500", "501-1000", "1000+"].map((size) => (
                      <option key={size} value={size}>{size} employees</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-white mb-2 font-medium">Hiring Goals</label>
                  <input
                    value={hiringGoals}
                    onChange={(e) => setHiringGoals(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-white mb-2 font-medium">Company Description</label>
                <textarea
                  rows={4}
                  value={companyDescription}
                  onChange={(e) => setCompanyDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>
            </section>
          )}

          {activeTab === "profile" && accountType === "agency" && (
            <section className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
              <h2 className="text-xl font-bold text-white mb-6">Agency Profile</h2>
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-white mb-2 font-medium">Agency Name</label>
                  <input
                    value={agencyName}
                    onChange={(e) => setAgencyName(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 font-medium">Website</label>
                  <input
                    value={agencyWebsite}
                    onChange={(e) => setAgencyWebsite(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 font-medium">Services</label>
                  <input
                    value={agencyServices}
                    onChange={(e) => setAgencyServices(e.target.value)}
                    placeholder="Interview Coaching, Placement"
                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-white mb-2 font-medium">Specialties</label>
                  <input
                    value={agencySpecialties}
                    onChange={(e) => setAgencySpecialties(e.target.value)}
                    placeholder="Engineering, Sales"
                    className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  />
                </div>
              </div>
              <div className="mt-4">
                <label className="block text-white mb-2 font-medium">Agency Description</label>
                <textarea
                  rows={4}
                  value={agencyDescription}
                  onChange={(e) => setAgencyDescription(e.target.value)}
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>
            </section>
          )}

          {activeTab === "security" && accountType === "talent" && (
          <section id="connections" className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Connections</h2>
            <div className="space-y-4">
              <div className="flex flex-col gap-4 rounded-xl border border-white/10 bg-slate-900 p-4 sm:flex-row sm:items-center">
                <Github className="w-6 h-6 text-slate-300" />
                <div className="flex-1">
                  <h3 className="text-white font-semibold">GitHub</h3>
                  <p className="text-sm text-slate-400">
                    {githubConnection?.connected ? "Connected to your Firebase account." : "Link GitHub through Firebase Auth."}
                  </p>
                </div>
                <button
                  onClick={connectGithub}
                  disabled={isConnectingGithub || isSaving}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 font-medium text-white transition-colors hover:bg-slate-600 disabled:opacity-60"
                >
                  {isConnectingGithub && <Loader2 className="w-4 h-4 animate-spin" />}
                  {githubConnection?.connected ? "Reconnect" : "Connect"}
                </button>
              </div>

              <div className="rounded-xl border border-white/10 bg-slate-900 p-4">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <Linkedin className="w-6 h-6 text-blue-400" />
                  <div className="flex-1">
                    <h3 className="text-white font-semibold">LinkedIn</h3>
                    <p className="text-sm text-slate-400">
                      {linkedInConnection?.connected ? "Profile URL imported." : "OAuth integration can be added later."}
                    </p>
                  </div>
                  <button
                    onClick={importLinkedIn}
                    disabled={isSaving}
                    className="inline-flex items-center justify-center gap-2 rounded-lg bg-blue-500 px-4 py-2 font-medium text-white transition-colors hover:bg-blue-400 disabled:opacity-60"
                  >
                    Import
                  </button>
                </div>
                <input
                  value={linkedInUrl}
                  onChange={(e) => setLinkedInUrl(e.target.value)}
                  placeholder="https://www.linkedin.com/in/your-profile"
                  className="mt-4 w-full px-4 py-3 bg-slate-950 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>
          </section>
          )}

          {activeTab === "profile" && accountType !== "agency" && (
          <section className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">{accountType === "business" ? "Company Culture" : "Work Vibe"}</h2>
            <div className="space-y-6">
              <div>
                <label className="block text-white mb-3 font-medium">Work Style</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["Remote", "Hybrid", "In-Office", "Flexible"].map((style) => (
                    <button
                      key={style}
                      onClick={() => toggleWorkVibeValue("style", style)}
                      className={`py-3 border rounded-lg text-white transition-colors ${
                        workVibe.style.includes(style)
                          ? "bg-amber-500/20 border-amber-500"
                          : "bg-slate-900 border-white/10 hover:border-amber-500"
                      }`}
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white mb-3 font-medium">Company Culture Preference</label>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {["Startup", "Enterprise", "Remote-First", "Mission-Driven"].map((culture) => (
                    <button
                      key={culture}
                      onClick={() => toggleWorkVibeValue("culture", culture)}
                      className={`py-3 border rounded-lg text-white transition-colors ${
                        workVibe.culture.includes(culture)
                          ? "bg-amber-500/20 border-amber-500"
                          : "bg-slate-900 border-white/10 hover:border-amber-500"
                      }`}
                    >
                      {culture}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white mb-3 font-medium">What matters most to you?</label>
                <textarea
                  rows={4}
                  value={workVibe.values}
                  onChange={(e) => setWorkVibe((current) => ({ ...current, values: e.target.value }))}
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>
            </div>
          </section>
          )}

          {(activeTab === "account" || activeTab === "profile" || activeTab === "privacy") && (
          <div className="flex justify-end">
            <button
              onClick={saveCurrentTab}
              disabled={isSaving}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-amber-400 to-orange-500 px-6 py-3 font-bold text-slate-900 transition-opacity hover:opacity-90 disabled:opacity-60"
            >
              {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : <Save className="w-5 h-5" />}
              Save Settings
            </button>
          </div>
          )}

          {activeTab === "security" && !isOperator && (
          <section className="bg-red-500/5 border border-red-500/20 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-2">Delete Account</h2>
            <p className="text-slate-400 mb-4">
              Account type is permanent for this email. Deleting this account removes the profile so the email can be used to create a new LadderStar account path later.
            </p>
            <button
              onClick={deleteAccount}
              disabled={isDeleting}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-red-500 px-5 py-3 font-bold text-white transition-colors hover:bg-red-400 disabled:opacity-60"
            >
              {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
              Delete Account
            </button>
          </section>
          )}
        </div>
      </main>
    </div>
  );
}

function splitCsv(value: string): string[] {
  return value
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);
}

function SettingsLoadingShell() {
  return (
    <div className="min-h-screen bg-slate-900">
      <NavHeader />
      <main className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-8">
          <div className="mb-3 h-9 w-72 rounded bg-white/10" />
          <div className="h-5 w-full max-w-lg rounded bg-white/10" />
        </div>
        <div className="space-y-6">
          {Array.from({ length: 4 }).map((_, index) => (
            <section key={index} className="min-h-[220px] rounded-xl border border-white/10 bg-slate-800/50 p-6">
              <div className="mb-6 h-7 w-48 rounded bg-white/10" />
              <div className="grid gap-4 md:grid-cols-2">
                <div className="h-12 rounded-xl bg-slate-900" />
                <div className="h-12 rounded-xl bg-slate-900" />
                <div className="h-12 rounded-xl bg-slate-900" />
                <div className="h-12 rounded-xl bg-slate-900" />
              </div>
            </section>
          ))}
        </div>
      </main>
    </div>
  );
}

function formatWalletDate(value: unknown): string {
  if (!value) return "Just now";
  if (typeof value === "string") {
    const date = new Date(value);
    return Number.isNaN(date.getTime()) ? value : date.toLocaleDateString();
  }
  return "Just now";
}
