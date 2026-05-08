"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { BarChart3, Eye, EyeOff, Loader2, Percent, RefreshCw, Save, Search, Shield, Tag, Upload, UserCog, Users, Wallet } from "lucide-react";
import NavHeader from "@/components/NavHeader";
import { useAuth } from "@/context/AuthContext";
import { auth } from "@/lib/firebase";
import {
  getEffectiveTierAmountCents,
  type BillingCycle,
  type PricingAudience,
  type PricingCatalog,
  type PricingTier,
} from "@/lib/pricing";
import { walletLabel, type WalletSummary } from "@/lib/wallet";

interface AdminSummary {
  counts: {
    totalUsers: number;
    talent: number;
    business: number;
    agency: number;
    admin: number;
    owner: number;
    suspended: number;
    jobs: number;
    scrapedJobs: number;
  };
  recentUsers: AdminUser[];
}

interface AdminUser {
  uid: string;
  email: string | null;
  displayName: string;
  photoURL?: string | null;
  accountType: string | null;
  accountTypeLocked: boolean;
  publicProfileEnabled: boolean;
  moderationStatus: "active" | "suspended";
  disabled: boolean;
  profileComplete?: number;
  publicProfileComplete?: number;
  createdAt: string | null;
  updatedAt: string | null;
  lastAdminActionAt?: string | null;
}

interface AdminUserDetail {
  profile: AdminUser & {
    role?: string | null;
    headline?: string;
    location?: string;
    slug?: string;
    adminNotes?: string;
  };
  publicProfile: {
    status: string;
    searchable: boolean;
    moderationStatus: string;
    slug: string;
    updatedAt: string | null;
    publishedAt: string | null;
  } | null;
  walletSummary: WalletSummary;
  auditLogs: Array<{
    id: string;
    action: string;
    actorEmail?: string | null;
    reason?: string | null;
    createdAt?: string | null;
  }>;
}

type FilterState = {
  q: string;
  accountType: string;
  status: string;
  publicProfile: string;
};

interface AdminPricingConfig {
  publishedCatalog: PricingCatalog;
  draftCatalog: PricingCatalog;
  version: number;
  publishedAt: string | null;
  publishedBy: string | null;
  updatedAt: string | null;
  updatedBy: string | null;
  lastPublishReason: string | null;
}

export default function AdminPage() {
  const router = useRouter();
  const { user, loading } = useAuth();
  const [summary, setSummary] = useState<AdminSummary | null>(null);
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [selectedUid, setSelectedUid] = useState<string | null>(null);
  const [detail, setDetail] = useState<AdminUserDetail | null>(null);
  const [adminEmail, setAdminEmail] = useState("");
  const [walletDelta, setWalletDelta] = useState("");
  const [walletPool, setWalletPool] = useState<"monthly" | "forever">("forever");
  const [walletReason, setWalletReason] = useState("");
  const [notesDraft, setNotesDraft] = useState("");
  const [filters, setFilters] = useState<FilterState>({ q: "", accountType: "all", status: "all", publicProfile: "all" });
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isActing, setIsActing] = useState(false);
  const [activeTab, setActiveTab] = useState<"users" | "pricing">("users");
  const [pricingConfig, setPricingConfig] = useState<AdminPricingConfig | null>(null);
  const [pricingDraft, setPricingDraft] = useState<PricingCatalog | null>(null);
  const [pricingReason, setPricingReason] = useState("");
  const [isPricingLoading, setIsPricingLoading] = useState(false);

  const isPrivileged = user?.accountType === "admin" || user?.accountType === "owner";
  const isOwner = user?.accountType === "owner";

  useEffect(() => {
    if (!loading && !user) router.push("/sign-in");
    if (!loading && user && !isPrivileged) router.push(user.accountType ? "/profile" : "/onboarding");
  }, [isPrivileged, loading, router, user]);

  const getToken = useCallback(async () => {
    if (!auth?.currentUser) throw new Error("Sign in again before using admin tools.");
    return auth.currentUser.getIdToken();
  }, []);

  const apiFetch = useCallback(async (path: string, init: RequestInit = {}) => {
    const token = await getToken();
    const response = await fetch(path, {
      ...init,
      headers: {
        Authorization: `Bearer ${token}`,
        ...(init.body ? { "Content-Type": "application/json" } : {}),
        ...(init.headers ?? {}),
      },
    });
    if (!response.ok) throw new Error(await response.text());
    return response.json();
  }, [getToken]);

  const fetchSummary = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const nextSummary = await apiFetch("/api/admin/summary") as AdminSummary;
      setSummary(nextSummary);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load admin summary.");
    } finally {
      setIsLoading(false);
    }
  }, [apiFetch]);

  const fetchUsers = useCallback(async () => {
    if (!isPrivileged) return;
    setError(null);
    try {
      const params = new URLSearchParams({
        q: filters.q,
        accountType: filters.accountType,
        status: filters.status,
        publicProfile: filters.publicProfile,
        limit: "75",
      });
      const data = await apiFetch(`/api/admin/users?${params.toString()}`) as { users: AdminUser[] };
      setUsers(data.users);
      if (!selectedUid && data.users[0]) setSelectedUid(data.users[0].uid);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load users.");
    }
  }, [apiFetch, filters, isPrivileged, selectedUid]);

  const fetchDetail = useCallback(async (uid: string | null) => {
    if (!uid) {
      setDetail(null);
      return;
    }
    try {
      const nextDetail = await apiFetch(`/api/admin/users/${uid}`) as AdminUserDetail;
      setDetail(nextDetail);
      setNotesDraft(nextDetail.profile.adminNotes ?? "");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load user details.");
    }
  }, [apiFetch]);

  const fetchPricing = useCallback(async () => {
    if (!isOwner) return;
    setIsPricingLoading(true);
    setError(null);
    try {
      const data = await apiFetch("/api/admin/pricing") as AdminPricingConfig;
      setPricingConfig(data);
      setPricingDraft(cloneCatalog(data.draftCatalog));
    } catch (err) {
      setError(err instanceof Error ? err.message : "Could not load pricing.");
    } finally {
      setIsPricingLoading(false);
    }
  }, [apiFetch, isOwner]);

  useEffect(() => {
    if (isPrivileged) {
      fetchSummary();
    }
  }, [fetchSummary, isPrivileged]);

  useEffect(() => {
    const id = window.setTimeout(() => {
      fetchUsers();
    }, 200);
    return () => window.clearTimeout(id);
  }, [fetchUsers]);

  useEffect(() => {
    fetchDetail(selectedUid);
  }, [fetchDetail, selectedUid]);

  useEffect(() => {
    if (isOwner) fetchPricing();
  }, [fetchPricing, isOwner]);

  async function callAdminApi(path: string, body: Record<string, unknown>, success: string) {
    setIsActing(true);
    setError(null);
    setMessage(null);
    try {
      await apiFetch(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setMessage(success);
      await Promise.all([fetchSummary(), fetchUsers(), fetchDetail(selectedUid)]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Admin action failed.");
    } finally {
      setIsActing(false);
    }
  }

  async function callPricingApi(path: string, body: Record<string, unknown>, success: string) {
    if (!pricingDraft) return;
    setIsActing(true);
    setError(null);
    setMessage(null);
    try {
      const data = await apiFetch(path, {
        method: "POST",
        body: JSON.stringify(body),
      });
      setMessage(success);
      if (data.catalog) setPricingDraft(cloneCatalog(data.catalog));
      if (data.draftCatalog) setPricingDraft(cloneCatalog(data.draftCatalog));
      await fetchPricing();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Pricing action failed.");
    } finally {
      setIsActing(false);
    }
  }

  function updateTier(audienceKey: string, tierId: string, updates: Partial<PricingTier>) {
    setPricingDraft((current) => {
      if (!current) return current;
      return {
        ...current,
        audiences: current.audiences.map((audience) => audience.key !== audienceKey ? audience : {
          ...audience,
          tiers: audience.tiers.map((tier) => tier.id !== tierId ? tier : {
            ...tier,
            ...updates,
            sale: updates.sale ? { ...(tier.sale ?? { enabled: false, percentOff: 0, label: "" }), ...updates.sale } : tier.sale,
          }),
        }),
      };
    });
  }

  const selectedUser = useMemo(
    () => users.find((row) => row.uid === selectedUid) ?? summary?.recentUsers.find((row) => row.uid === selectedUid) ?? null,
    [selectedUid, summary?.recentUsers, users]
  );

  if (loading || isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!user || !isPrivileged) return null;

  const counts = summary?.counts;
  const wallet = detail?.walletSummary.wallet;

  return (
    <div className="min-h-screen bg-slate-900">
      <NavHeader />
      <main className="mx-auto max-w-7xl px-6 py-8">
        <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-amber-500/30 bg-amber-500/10 px-3 py-1 text-sm text-amber-300">
              <Shield className="h-4 w-4" />
              {isOwner ? "Owner" : "Admin"}
            </div>
            <h1 className="text-3xl font-bold text-white">Admin Console</h1>
            <p className="text-slate-400">Search, inspect, moderate, credit, and audit account operations.</p>
          </div>
          <button
            onClick={() => Promise.all([fetchSummary(), fetchUsers(), fetchDetail(selectedUid)])}
            disabled={isActing}
            className="inline-flex items-center gap-2 rounded-lg bg-slate-800 px-4 py-2 font-medium text-white hover:bg-slate-700 disabled:opacity-60"
          >
            <RefreshCw className="h-4 w-4" />
            Refresh
          </button>
        </div>

        {(message || error) && (
          <div className={`mb-6 rounded-lg border p-4 ${error ? "border-red-500/30 bg-red-500/10 text-red-300" : "border-green-500/30 bg-green-500/10 text-green-300"}`}>
            {error || message}
          </div>
        )}

        <div className="mb-8 grid gap-4 md:grid-cols-4">
          {[
            { label: "Total Users", value: counts?.totalUsers ?? 0, icon: Users },
            { label: "Admins", value: (counts?.admin ?? 0) + (counts?.owner ?? 0), icon: Shield },
            { label: "Suspended", value: counts?.suspended ?? 0, icon: UserCog },
            { label: "Jobs", value: (counts?.jobs ?? 0) + (counts?.scrapedJobs ?? 0), icon: BarChart3 },
          ].map((stat) => (
            <div key={stat.label} className="rounded-lg border border-white/10 bg-slate-800/50 p-5">
              <stat.icon className="mb-3 h-6 w-6 text-amber-400" />
              <div className="text-2xl font-bold text-white">{stat.value}</div>
              <div className="text-sm text-slate-400">{stat.label}</div>
            </div>
          ))}
        </div>

        {isOwner && (
          <div className="mb-8 inline-grid grid-cols-2 rounded-lg border border-white/10 bg-slate-800/50 p-1">
            <button
              type="button"
              onClick={() => setActiveTab("users")}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold transition ${activeTab === "users" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
            >
              <Users className="h-4 w-4" />
              Users
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("pricing")}
              className={`inline-flex min-h-11 items-center justify-center gap-2 rounded-md px-4 text-sm font-bold transition ${activeTab === "pricing" ? "bg-amber-500 text-slate-950" : "text-slate-300 hover:bg-white/5 hover:text-white"}`}
            >
              <Tag className="h-4 w-4" />
              Pricing
            </button>
          </div>
        )}

        {activeTab === "users" && isOwner && (
          <section className="mb-8 rounded-lg border border-white/10 bg-slate-800/50 p-6">
            <h2 className="mb-4 text-xl font-bold text-white">Owner Role Management</h2>
            <div className="flex flex-col gap-3 lg:flex-row">
              <input
                value={adminEmail}
                onChange={(event) => setAdminEmail(event.target.value)}
                placeholder="person@example.com"
                className="min-w-0 flex-1 rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
              <button
                onClick={() => callAdminApi("/api/admin/users/set-role", { email: adminEmail, action: "promote-admin" }, "Admin promoted.")}
                disabled={isActing || !adminEmail.trim()}
                className="rounded-lg bg-amber-500 px-5 py-3 font-bold text-slate-900 hover:bg-amber-400 disabled:opacity-60"
              >
                Promote Admin
              </button>
              <button
                onClick={() => callAdminApi("/api/admin/users/set-role", { email: adminEmail, action: "demote-admin" }, "Admin demoted.")}
                disabled={isActing || !adminEmail.trim()}
                className="rounded-lg bg-slate-700 px-5 py-3 font-bold text-white hover:bg-slate-600 disabled:opacity-60"
              >
                Demote Admin
              </button>
              <button
                onClick={() => callAdminApi("/api/admin/migrate/talent", {}, "Legacy account profiles migrated to Talent.")}
                disabled={isActing}
                className="rounded-lg bg-slate-700 px-5 py-3 font-bold text-white hover:bg-slate-600 disabled:opacity-60"
              >
                Migrate Legacy Users
              </button>
            </div>
          </section>
        )}

        {activeTab === "users" && (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.1fr)_minmax(360px,0.9fr)]">
          <section className="rounded-lg border border-white/10 bg-slate-800/50 p-6">
            <div className="mb-4 grid gap-3 md:grid-cols-[minmax(0,1fr)_150px_150px_150px]">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-3.5 h-4 w-4 text-slate-500" />
                <input
                  value={filters.q}
                  onChange={(event) => setFilters((current) => ({ ...current, q: event.target.value }))}
                  placeholder="Search users"
                  className="w-full rounded-lg border border-white/10 bg-slate-900 py-3 pl-10 pr-4 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </label>
              <FilterSelect value={filters.accountType} onChange={(value) => setFilters((current) => ({ ...current, accountType: value }))} options={["all", "talent", "business", "agency", "admin", "owner"]} />
              <FilterSelect value={filters.status} onChange={(value) => setFilters((current) => ({ ...current, status: value }))} options={["all", "active", "suspended", "disabled"]} />
              <FilterSelect value={filters.publicProfile} onChange={(value) => setFilters((current) => ({ ...current, publicProfile: value }))} options={["all", "visible", "hidden"]} />
            </div>

            <div className="overflow-x-auto">
              <table className="w-full min-w-[760px] text-left text-sm">
                <thead className="text-slate-400">
                  <tr className="border-b border-white/10">
                    <th className="py-3 pr-4">User</th>
                    <th className="py-3 pr-4">Type</th>
                    <th className="py-3 pr-4">Status</th>
                    <th className="py-3 pr-4">Public</th>
                    <th className="py-3 pr-4">Updated</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((row) => (
                    <tr
                      key={row.uid}
                      onClick={() => setSelectedUid(row.uid)}
                      className={`cursor-pointer border-b border-white/5 text-slate-300 hover:bg-white/5 ${selectedUid === row.uid ? "bg-amber-500/10" : ""}`}
                    >
                      <td className="py-3 pr-4">
                        <div className="font-medium text-white">{row.displayName || "Unnamed"}</div>
                        <div className="text-slate-500">{row.email}</div>
                      </td>
                      <td className="py-3 pr-4 capitalize">{row.accountType ?? "none"}</td>
                      <td className="py-3 pr-4">
                        <span className={row.moderationStatus === "suspended" || row.disabled ? "text-red-300" : "text-green-300"}>
                          {row.disabled ? "disabled" : row.moderationStatus}
                        </span>
                      </td>
                      <td className="py-3 pr-4">{row.publicProfileEnabled ? "Visible" : "Hidden"}</td>
                      <td className="py-3 pr-4">{formatDate(row.updatedAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </section>

          <aside className="space-y-6">
            <section className="rounded-lg border border-white/10 bg-slate-800/50 p-6">
              <h2 className="mb-4 text-xl font-bold text-white">Account Detail</h2>
              {!selectedUser || !detail ? (
                <p className="text-slate-400">Select a user to inspect account operations.</p>
              ) : (
                <div className="space-y-4">
                  <div>
                    <div className="font-semibold text-white">{detail.profile.displayName || "Unnamed"}</div>
                    <div className="text-sm text-slate-400">{detail.profile.email}</div>
                    <div className="mt-2 text-xs text-slate-500">{detail.profile.uid}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <Info label="Type" value={detail.profile.accountType ?? "none"} />
                    <Info label="Public" value={detail.publicProfile?.status ?? (detail.profile.publicProfileEnabled ? "visible" : "hidden")} />
                    <Info label="Private %" value={`${detail.profile.profileComplete ?? 0}%`} />
                    <Info label="Public %" value={`${detail.profile.publicProfileComplete ?? 0}%`} />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <button
                      onClick={() => {
                        const reason = window.prompt("Reason for this status change?");
                        if (!reason) return;
                        callAdminApi(`/api/admin/users/${detail.profile.uid}/status`, {
                          moderationStatus: detail.profile.moderationStatus === "suspended" ? "active" : "suspended",
                          reason,
                        }, detail.profile.moderationStatus === "suspended" ? "User reactivated." : "User suspended.");
                      }}
                      disabled={isActing || detail.profile.accountType === "owner"}
                      className="rounded-lg bg-slate-700 px-3 py-2 text-white hover:bg-slate-600 disabled:opacity-40"
                    >
                      {detail.profile.moderationStatus === "suspended" ? "Reactivate" : "Suspend"}
                    </button>
                    <button
                      onClick={() => {
                        const reason = window.prompt("Reason for this public profile change?");
                        if (!reason) return;
                        callAdminApi(`/api/admin/users/${detail.profile.uid}/public-profile`, {
                          publicProfileEnabled: !detail.profile.publicProfileEnabled,
                          reason,
                        }, detail.profile.publicProfileEnabled ? "Profile hidden." : "Profile visible.");
                      }}
                      disabled={isActing}
                      className="inline-flex items-center gap-1 rounded-lg bg-slate-700 px-3 py-2 text-white hover:bg-slate-600 disabled:opacity-40"
                    >
                      {detail.profile.publicProfileEnabled ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      {detail.profile.publicProfileEnabled ? "Hide" : "Show"}
                    </button>
                    {isOwner && detail.profile.accountType !== "owner" && (
                      <button
                        onClick={() => {
                          const reason = window.prompt("Reason for disabling this account?");
                          if (!reason) return;
                          callAdminApi(`/api/admin/users/${detail.profile.uid}/status`, {
                            disabled: true,
                            reason,
                          }, "User disabled.");
                        }}
                        disabled={isActing}
                        className="rounded-lg bg-red-500/20 px-3 py-2 text-red-300 hover:bg-red-500/30 disabled:opacity-40"
                      >
                        Disable
                      </button>
                    )}
                  </div>
                </div>
              )}
            </section>

            {detail && (
              <>
                <section className="rounded-lg border border-white/10 bg-slate-800/50 p-6">
                  <div className="mb-4 flex items-center gap-2">
                    <Wallet className="h-5 w-5 text-emerald-300" />
                    <h2 className="text-xl font-bold text-white">Wallet</h2>
                  </div>
                  {wallet ? (
                    <div className="space-y-4">
                      <div className="rounded-lg border border-emerald-500/30 bg-emerald-500/10 p-4">
                        <div className="text-3xl font-bold text-white">{wallet.balance}</div>
                        <div className="text-sm font-medium text-emerald-300">Total {walletLabel(wallet.currency)}</div>
                      </div>
                      <div className="grid gap-3 sm:grid-cols-2">
                        <Info label="Monthly" value={`${wallet.monthlyBalance} ${walletLabel(wallet.currency)}`} />
                        <Info label="Forever" value={`${wallet.foreverBalance} ${walletLabel(wallet.currency)}`} />
                      </div>
                      <div className="grid gap-3 sm:grid-cols-[110px_130px_minmax(0,1fr)]">
                        <input
                          value={walletDelta}
                          onChange={(event) => setWalletDelta(event.target.value)}
                          placeholder="+10"
                          className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                        />
                        <select
                          value={walletPool}
                          onChange={(event) => setWalletPool(event.target.value === "monthly" ? "monthly" : "forever")}
                          className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                        >
                          <option value="forever">Forever</option>
                          <option value="monthly">Monthly</option>
                        </select>
                        <input
                          value={walletReason}
                          onChange={(event) => setWalletReason(event.target.value)}
                          placeholder="Adjustment reason"
                          className="rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
                        />
                      </div>
                      <button
                        onClick={() => callAdminApi("/api/admin/wallets/adjust", {
                          uid: detail.profile.uid,
                          delta: Number(walletDelta),
                          pool: walletPool,
                          reason: walletReason,
                        }, "Wallet adjusted.")}
                        disabled={isActing || !walletDelta.trim() || !walletReason.trim()}
                        className="rounded-lg bg-emerald-500 px-4 py-2 font-bold text-slate-950 disabled:opacity-50"
                      >
                        Apply Adjustment
                      </button>
                    </div>
                  ) : (
                    <p className="text-slate-400">This account type does not support a wallet.</p>
                  )}
                </section>

                <section className="rounded-lg border border-white/10 bg-slate-800/50 p-6">
                  <h2 className="mb-4 text-xl font-bold text-white">Support Notes</h2>
                  <textarea
                    value={notesDraft}
                    onChange={(event) => setNotesDraft(event.target.value)}
                    rows={5}
                    className="w-full resize-none rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                  />
                  <button
                    onClick={() => callAdminApi(`/api/admin/users/${detail.profile.uid}/notes`, { adminNotes: notesDraft }, "Support notes saved.")}
                    disabled={isActing}
                    className="mt-3 rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600 disabled:opacity-50"
                  >
                    Save Notes
                  </button>
                </section>

                <section className="rounded-lg border border-white/10 bg-slate-800/50 p-6">
                  <h2 className="mb-4 text-xl font-bold text-white">Audit Timeline</h2>
                  <div className="space-y-3">
                    {detail.auditLogs.length > 0 ? detail.auditLogs.map((entry) => (
                      <div key={entry.id} className="rounded-lg border border-white/10 bg-slate-900 p-3">
                        <div className="font-semibold text-white">{entry.action}</div>
                        <div className="text-sm text-slate-400">{entry.reason || "No reason recorded"}</div>
                        <div className="mt-1 text-xs text-slate-500">
                          {entry.actorEmail || "Unknown actor"} · {formatDate(entry.createdAt ?? null)}
                        </div>
                      </div>
                    )) : (
                      <p className="text-slate-400">No audit entries yet.</p>
                    )}
                  </div>
                </section>
              </>
            )}
          </aside>
        </div>
        )}

        {activeTab === "pricing" && isOwner && (
          <section className="rounded-lg border border-white/10 bg-slate-800/50 p-6">
            <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="mb-2 inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-sm text-emerald-300">
                  <Percent className="h-4 w-4" />
                  Owner pricing
                </div>
                <h2 className="text-2xl font-bold text-white">Pricing Catalog</h2>
                <p className="mt-1 max-w-3xl text-sm leading-6 text-slate-400">
                  Draft changes are private. Publishing updates the public pricing page and new Stripe checkout sessions immediately.
                </p>
                <p className="mt-2 text-xs text-slate-500">
                  Version {pricingConfig?.version ?? 0} · Last published {formatDateTime(pricingConfig?.publishedAt ?? null)}
                </p>
              </div>
              <div className="flex flex-col gap-3 sm:flex-row">
                <button
                  type="button"
                  onClick={fetchPricing}
                  disabled={isActing || isPricingLoading}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600 disabled:opacity-50"
                >
                  <RefreshCw className="h-4 w-4" />
                  Reload
                </button>
                <button
                  type="button"
                  onClick={() => pricingDraft && callPricingApi("/api/admin/pricing/draft", { catalog: pricingDraft }, "Pricing draft saved.")}
                  disabled={isActing || isPricingLoading || !pricingDraft}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-slate-700 px-4 py-2 font-semibold text-white hover:bg-slate-600 disabled:opacity-50"
                >
                  <Save className="h-4 w-4" />
                  Save Draft
                </button>
                <button
                  type="button"
                  onClick={() => pricingDraft && callPricingApi("/api/admin/pricing/publish", { catalog: pricingDraft, reason: pricingReason }, "Pricing published.")}
                  disabled={isActing || isPricingLoading || !pricingDraft || !pricingReason.trim()}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-amber-500 px-4 py-2 font-bold text-slate-950 hover:bg-amber-400 disabled:opacity-50"
                >
                  <Upload className="h-4 w-4" />
                  Publish
                </button>
              </div>
            </div>

            <label className="mb-6 block">
              <span className="mb-2 block text-sm font-semibold text-slate-300">Publish reason</span>
              <input
                value={pricingReason}
                onChange={(event) => setPricingReason(event.target.value)}
                placeholder="Example: Spring launch sale"
                className="w-full rounded-lg border border-white/10 bg-slate-900 px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
              />
            </label>

            {isPricingLoading && (
              <div className="flex min-h-48 items-center justify-center">
                <Loader2 className="h-7 w-7 animate-spin text-amber-500" />
              </div>
            )}

            {!isPricingLoading && pricingDraft && (
              <div className="space-y-6">
                {pricingDraft.audiences.map((audience) => (
                  <PricingAudienceEditor
                    key={audience.key}
                    audience={audience}
                    onTierChange={(tierId, updates) => updateTier(audience.key, tierId, updates)}
                  />
                ))}
              </div>
            )}
          </section>
        )}
      </main>
    </div>
  );
}

function FilterSelect({ value, onChange, options }: { value: string; onChange: (value: string) => void; options: string[] }) {
  return (
    <select
      value={value}
      onChange={(event) => onChange(event.target.value)}
      className="rounded-lg border border-white/10 bg-slate-900 px-3 py-3 text-white focus:border-amber-500 focus:outline-none"
    >
      {options.map((option) => (
        <option key={option} value={option}>{option}</option>
      ))}
    </select>
  );
}

function PricingAudienceEditor({
  audience,
  onTierChange,
}: {
  audience: PricingAudience;
  onTierChange: (tierId: string, updates: Partial<PricingTier>) => void;
}) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900/70 p-5">
      <div className="mb-5">
        <h3 className="text-xl font-bold text-white">{audience.label}</h3>
        <p className="mt-1 text-sm text-slate-400">{audience.currencyLabel}</p>
      </div>
      <div className="grid gap-4 xl:grid-cols-2">
        {audience.tiers.map((tier) => (
          <div key={tier.id} className="rounded-lg border border-white/10 bg-slate-950/60 p-4">
            <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <div className="text-lg font-bold text-white">{tier.name}</div>
                <div className="text-xs text-slate-500">{tier.id}</div>
              </div>
              <div className="rounded-lg border border-emerald-500/20 bg-emerald-500/10 px-3 py-2 text-right">
                <div className="text-sm font-bold text-emerald-200">{formatAdminPrice(tier, "monthly")}/mo</div>
                <div className="text-xs text-emerald-300">{formatAdminPrice(tier, "annual")}/yr</div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              <NumberField label="Monthly $" value={tier.monthlyPrice} onChange={(value) => onTierChange(tier.id, { monthlyPrice: value })} />
              <OptionalNumberField label="Annual $" value={tier.annualPrice} onChange={(value) => onTierChange(tier.id, { annualPrice: value })} />
              <NumberField label="Allowance" value={tier.monthlyAllowance} onChange={(value) => onTierChange(tier.id, { monthlyAllowance: Math.round(value) })} />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-[130px_120px_minmax(0,1fr)]">
              <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={Boolean(tier.sale?.enabled)}
                  onChange={(event) => onTierChange(tier.id, { sale: { ...(tier.sale ?? { percentOff: 0 }), enabled: event.target.checked } })}
                  className="h-4 w-4"
                />
                Sale
              </label>
              <NumberField label="% off" value={tier.sale?.percentOff ?? 0} onChange={(value) => onTierChange(tier.id, { sale: { ...(tier.sale ?? { enabled: false }), percentOff: Math.round(value) } })} />
              <TextField label="Sale label" value={tier.sale?.label ?? ""} onChange={(value) => onTierChange(tier.id, { sale: { ...(tier.sale ?? { enabled: false, percentOff: 0 }), label: value } })} />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <TextField label="CTA" value={tier.cta} onChange={(value) => onTierChange(tier.id, { cta: value })} />
              <TextField label="Contact href" value={tier.contactHref ?? ""} onChange={(value) => onTierChange(tier.id, { contactHref: value })} />
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={Boolean(tier.featured)}
                  onChange={(event) => onTierChange(tier.id, { featured: event.target.checked })}
                  className="h-4 w-4"
                />
                Featured
              </label>
              <label className="flex items-center gap-2 rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-sm font-semibold text-slate-200">
                <input
                  type="checkbox"
                  checked={Boolean(tier.earlyAccess)}
                  onChange={(event) => onTierChange(tier.id, { earlyAccess: event.target.checked })}
                  className="h-4 w-4"
                />
                Early access
              </label>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function NumberField({ label, value, onChange }: { label: string; value: number | string; onChange: (value: number) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-400">{label}</span>
      <input
        type="number"
        min="0"
        step="1"
        value={value}
        onChange={(event) => onChange(Number(event.target.value || 0))}
        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
      />
    </label>
  );
}

function OptionalNumberField({ label, value, onChange }: { label: string; value?: number; onChange: (value: number | undefined) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-400">{label}</span>
      <input
        type="number"
        min="0"
        step="1"
        value={value ?? ""}
        onChange={(event) => onChange(event.target.value === "" ? undefined : Number(event.target.value))}
        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
      />
    </label>
  );
}

function TextField({ label, value, onChange }: { label: string; value: string; onChange: (value: string) => void }) {
  return (
    <label className="block">
      <span className="mb-1 block text-xs font-semibold text-slate-400">{label}</span>
      <input
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="w-full rounded-lg border border-white/10 bg-slate-900 px-3 py-2 text-white focus:border-amber-500 focus:outline-none"
      />
    </label>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border border-white/10 bg-slate-900 p-3">
      <div className="text-xs text-slate-500">{label}</div>
      <div className="mt-1 truncate text-sm font-semibold capitalize text-white">{value}</div>
    </div>
  );
}

function formatAdminPrice(tier: PricingTier, cycle: BillingCycle) {
  const { effectiveAmountCents } = getEffectiveTierAmountCents(tier, cycle);
  return `$${(effectiveAmountCents / 100).toLocaleString("en-US", { maximumFractionDigits: 2 })}`;
}

function formatDate(value: string | null): string {
  if (!value) return "Unknown";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatDateTime(value: string | null): string {
  if (!value) return "Never";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return date.toLocaleString("en-US", { month: "short", day: "numeric", year: "numeric", hour: "numeric", minute: "2-digit" });
}

function cloneCatalog(catalog: PricingCatalog): PricingCatalog {
  return JSON.parse(JSON.stringify(catalog)) as PricingCatalog;
}
