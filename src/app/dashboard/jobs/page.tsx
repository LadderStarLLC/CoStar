'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/AuthContext';
import { getJobsByEmployer, JobData, publishJob, toggleJobStatus, deleteJob, createJob } from '@/lib/jobs';
import { getCompanyByEmployer, CompanyData, createCompany, updateCompany } from '@/lib/companies';
import JobCard from '@/components/JobCard';
import JobForm from '@/components/JobForm';
import {
  Plus,
  Loader2,
  AlertCircle,
  Briefcase,
  BarChart3,
  Eye,
  Users,
  Edit,
  Trash2,
  Pause,
  Play,
  ExternalLink,
  Clipboard,
  MessageSquare,
  Film,
  ShieldCheck,
} from 'lucide-react';
import Link from 'next/link';

type BusinessEntitlements = {
  features?: {
    activeJobLimit?: number | null;
    aiScreenings?: boolean;
    candidateSummaries?: boolean;
    priorityJobs?: boolean;
  };
  tierName?: string;
  status?: string;
};

type ScreeningReport = {
  id: string;
  jobId?: string;
  jobTitle?: string;
  participantName?: string;
  participantEmail?: string;
  analysis?: string;
  createdAt?: string | null;
  recordingId?: string | null;
  recording?: {
    id: string;
    status: string;
    fileSizeBytes?: number | null;
    durationSeconds?: number | null;
    retentionDeleteAt?: string | null;
    deletedAt?: string | null;
  } | null;
  recordingConsent?: {
    consentedAt?: string | null;
    consentTextVersion?: string | null;
  } | null;
};

export default function EmployerJobsPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [jobs, setJobs] = useState<JobData[]>([]);
  const [company, setCompany] = useState<CompanyData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateForm, setShowCreateForm] = useState(false);
  const [editingJob, setEditingJob] = useState<JobData | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showCompanySetup, setShowCompanySetup] = useState(false);
  const [entitlements, setEntitlements] = useState<BusinessEntitlements | null>(null);
  const [screeningJob, setScreeningJob] = useState<JobData | null>(null);
  const [screeningMode, setScreeningMode] = useState<'auto' | 'exact' | 'bank'>('auto');
  const [screeningQuestions, setScreeningQuestions] = useState('');
  const [screeningRecordingEnabled, setScreeningRecordingEnabled] = useState(false);
  const [screeningUrl, setScreeningUrl] = useState('');
  const [isCreatingScreening, setIsCreatingScreening] = useState(false);
  const [screeningReports, setScreeningReports] = useState<ScreeningReport[]>([]);
  const [recordingPlaybackUrls, setRecordingPlaybackUrls] = useState<Record<string, string>>({});
  const [recordingActionId, setRecordingActionId] = useState<string | null>(null);
  const [companyForm, setCompanyForm] = useState({
    name: '',
    website: '',
    description: '',
    companySize: '1-10',
    city: '',
    state: '',
    country: '',
  });

  // Redirect if not logged in or not a Business account
  useEffect(() => {
    if (!authLoading && !user) {
      router.push('/sign-in');
    }
    if (!authLoading && user && user.accountType !== 'business') {
      router.push(user.accountType ? '/profile' : '/onboarding');
    }
  }, [user, authLoading, router]);

  // Load jobs and company
  useEffect(() => {
    const loadData = async () => {
      if (!user) return;

      setIsLoading(true);
      try {
        // Load company
        const companyData = await getCompanyByEmployer(user.uid);
        setCompany(companyData);

        if (!companyData) {
          // Check if we should show company setup
          setShowCompanySetup(true);
        }

        // Load jobs
        const jobsData = await getJobsByEmployer(user.uid);
        setJobs(jobsData);

        const token = await user.getIdToken();
        const entRes = await fetch('/api/billing/entitlements', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (entRes.ok) {
          const data = await entRes.json();
          setEntitlements(data.entitlements ?? null);
        }
        const reportsRes = await fetch('/api/business/screening-reports', {
          headers: { Authorization: `Bearer ${token}` },
        });
        if (reportsRes.ok) {
          const data = await reportsRes.json();
          setScreeningReports(data.reports ?? []);
        }
      } catch (err) {
        setError('Failed to load data');
        console.error('Error loading data:', err);
      } finally {
        setIsLoading(false);
      }
    };

    if (user) {
      loadData();
    }
  }, [user]);

  const handleCreateCompany = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setIsSubmitting(true);
    try {
      const companyId = await createCompany(
        {
          name: companyForm.name,
          website: companyForm.website,
          description: companyForm.description,
          companySize: companyForm.companySize,
          headquarters: {
            city: companyForm.city,
            state: companyForm.state,
            country: companyForm.country,
          },
        },
        user.uid
      );

      const newCompany = await getCompanyByEmployer(user.uid);
      setCompany(newCompany);
      setShowCompanySetup(false);
    } catch (err) {
      setError('Failed to create company');
      console.error('Error creating company:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCreateJob = async (jobData: JobData) => {
    if (!user || !company) return;

    setIsSubmitting(true);
    try {
      const activeJobLimit = entitlements?.features?.activeJobLimit ?? 1;
      const activeJobs = jobs.filter((job) => job.status === 'active').length;
      if (jobData.status === 'active' && activeJobLimit !== null && activeJobs >= activeJobLimit) {
        throw new Error(`Your ${entitlements?.tierName ?? 'Free'} plan supports ${activeJobLimit} active job${activeJobLimit === 1 ? '' : 's'}. Upgrade to publish more roles.`);
      }

      const jobId = await createJob(
        {
          ...jobData,
          companyId: company.companyId,
          companyName: company.name,
        },
        user.uid
      );

      // Refresh jobs list
      const jobsData = await getJobsByEmployer(user.uid);
      setJobs(jobsData);
      setShowCreateForm(false);

      // If published, redirect to view
      if (jobData.status === 'active') {
        router.push(`/jobs`);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to create job');
      console.error('Error creating job:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateJob = async (jobData: JobData) => {
    if (!user || !editingJob?.jobId) return;

    setIsSubmitting(true);
    try {
      // Update job logic would go here
      setEditingJob(null);

      // Refresh jobs list
      const jobsData = await getJobsByEmployer(user.uid);
      setJobs(jobsData);
    } catch (err) {
      setError('Failed to update job');
      console.error('Error updating job:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handlePublishJob = async (jobId: string) => {
    try {
      const activeJobLimit = entitlements?.features?.activeJobLimit ?? 1;
      const activeJobs = jobs.filter((job) => job.status === 'active').length;
      if (activeJobLimit !== null && activeJobs >= activeJobLimit) {
        throw new Error(`Your ${entitlements?.tierName ?? 'Free'} plan supports ${activeJobLimit} active job${activeJobLimit === 1 ? '' : 's'}. Upgrade to publish more roles.`);
      }
      await publishJob(jobId);
      // Refresh jobs
      if (user) {
        const jobsData = await getJobsByEmployer(user.uid);
        setJobs(jobsData);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to publish job');
    }
  };

  const handleToggleJobStatus = async (jobId: string, currentStatus: string) => {
    try {
      const isPaused = currentStatus === 'paused';
      await toggleJobStatus(jobId, !isPaused);
      // Refresh jobs
      if (user) {
        const jobsData = await getJobsByEmployer(user.uid);
        setJobs(jobsData);
      }
    } catch (err) {
      setError('Failed to update job status');
    }
  };

  const handleDeleteJob = async (jobId: string) => {
    if (!confirm('Are you sure you want to delete this job?')) return;

    try {
      await deleteJob(jobId);
      // Refresh jobs
      if (user) {
        const jobsData = await getJobsByEmployer(user.uid);
        setJobs(jobsData);
      }
    } catch (err) {
      setError('Failed to delete job');
    }
  };

  const handleCreateScreeningLink = async () => {
    if (!user || !screeningJob?.jobId) return;
    setIsCreatingScreening(true);
    setError(null);
    setScreeningUrl('');
    try {
      const token = await user.getIdToken();
      const res = await fetch('/api/business/screening-links', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          jobId: screeningJob.jobId,
          questionMode: screeningMode,
          questions: screeningQuestions.split('\n').map((q) => q.trim()).filter(Boolean),
          recordingEnabled: screeningRecordingEnabled,
        }),
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Could not create screening link.');
      setScreeningUrl(payload.url);
      if (screeningRecordingEnabled && !payload.recordingEnabled) {
        setError('Screening link created, but recording is disabled by server configuration.');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not create screening link.');
    } finally {
      setIsCreatingScreening(false);
    }
  };

  const handleLoadRecording = async (recordingId: string) => {
    if (!user) return;
    setRecordingActionId(recordingId);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/business/screening-recordings/${recordingId}/playback`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Could not load recording.');
      setRecordingPlaybackUrls((current) => ({ ...current, [recordingId]: payload.url }));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not load recording.');
    } finally {
      setRecordingActionId(null);
    }
  };

  const handleDeleteRecording = async (recordingId: string) => {
    if (!user || !confirm('Delete this screening recording? This removes playback access.')) return;
    setRecordingActionId(recordingId);
    setError(null);
    try {
      const token = await user.getIdToken();
      const res = await fetch(`/api/business/screening-recordings/${recordingId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      const payload = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(payload.error || 'Could not delete recording.');
      setRecordingPlaybackUrls((current) => {
        const next = { ...current };
        delete next[recordingId];
        return next;
      });
      setScreeningReports((current) => current.map((report) => report.recording?.id === recordingId
        ? { ...report, recording: { ...report.recording, status: 'deleted', deletedAt: new Date().toISOString() } }
        : report));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not delete recording.');
    } finally {
      setRecordingActionId(null);
    }
  };

  if (authLoading || isLoading) {
    return <EmployerJobsLoadingShell />;
  }

  if (!user) {
    return null;
  }

  // Company setup form
  if (showCompanySetup) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-2xl mx-auto px-4 py-12">
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-8">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Set Up Your Company</h1>
                <p className="text-slate-400">Create your company profile to start posting jobs</p>
              </div>
            </div>

            <form onSubmit={handleCreateCompany} className="space-y-4">
              <div>
                <label className="block text-white text-sm font-medium mb-2">Company Name *</label>
                <input
                  type="text"
                  value={companyForm.name}
                  onChange={(e) => setCompanyForm({ ...companyForm, name: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  placeholder="Acme Inc."
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Website</label>
                <input
                  type="url"
                  value={companyForm.website}
                  onChange={(e) => setCompanyForm({ ...companyForm, website: e.target.value })}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                  placeholder="https://acme.com"
                />
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Company Size *</label>
                <select
                  value={companyForm.companySize}
                  onChange={(e) => setCompanyForm({ ...companyForm, companySize: e.target.value })}
                  required
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="1-10">1-10 employees</option>
                  <option value="11-50">11-50 employees</option>
                  <option value="51-200">51-200 employees</option>
                  <option value="201-500">201-500 employees</option>
                  <option value="501-1000">501-1000 employees</option>
                  <option value="1000+">1000+ employees</option>
                </select>
              </div>

              <div className="grid md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-white text-sm font-medium mb-2">City</label>
                  <input
                    type="text"
                    value={companyForm.city}
                    onChange={(e) => setCompanyForm({ ...companyForm, city: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    placeholder="San Francisco"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">State</label>
                  <input
                    type="text"
                    value={companyForm.state}
                    onChange={(e) => setCompanyForm({ ...companyForm, state: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    placeholder="California"
                  />
                </div>
                <div>
                  <label className="block text-white text-sm font-medium mb-2">Country</label>
                  <input
                    type="text"
                    value={companyForm.country}
                    onChange={(e) => setCompanyForm({ ...companyForm, country: e.target.value })}
                    className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                    placeholder="USA"
                  />
                </div>
              </div>

              <div>
                <label className="block text-white text-sm font-medium mb-2">Description</label>
                <textarea
                  value={companyForm.description}
                  onChange={(e) => setCompanyForm({ ...companyForm, description: e.target.value })}
                  rows={4}
                  className="w-full bg-slate-900 border border-white/10 rounded-xl px-4 py-3 text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none resize-none"
                  placeholder="Tell us about your company..."
                />
              </div>

              {error && (
                <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-3 text-red-400 text-sm">
                  {error}
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 flex items-center justify-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 rounded-xl font-bold disabled:opacity-50"
                >
                  {isSubmitting ? (
                    <Loader2 className="w-5 h-5 animate-spin" />
                  ) : (
                    <>
                      <Plus className="w-5 h-5" />
                      Create Company
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  }

  // Create/Edit Job Form
  if (showCreateForm || editingJob) {
    return (
      <div className="min-h-screen bg-slate-900">
        <div className="max-w-4xl mx-auto px-4 py-8">
          <button
            onClick={() => {
              setShowCreateForm(false);
              setEditingJob(null);
            }}
            className="flex items-center gap-2 text-slate-400 hover:text-white mb-6 transition-colors"
          >
            ← Back to jobs
          </button>

          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
            <h1 className="text-2xl font-bold text-white mb-6">
              {editingJob ? 'Edit Job' : 'Post a New Job'}
            </h1>

            <JobForm
              job={editingJob || undefined}
              company={company || undefined}
              employerId={user.uid}
              onSubmit={editingJob ? handleUpdateJob : handleCreateJob}
              onCancel={() => {
                setShowCreateForm(false);
                setEditingJob(null);
              }}
              isLoading={isSubmitting}
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <div className="bg-slate-800/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-amber-400 to-orange-500 flex items-center justify-center">
                <Briefcase className="w-6 h-6 text-slate-900" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-white">Your Job Postings</h1>
                <p className="text-slate-400">
                  Manage your job listings and track applications
                </p>
              </div>
            </div>

            <button
              onClick={() => setShowCreateForm(true)}
              className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-amber-400 to-orange-500 hover:from-amber-300 hover:to-orange-400 text-slate-900 rounded-xl font-bold"
            >
              <Plus className="w-5 h-5" />
              Post Job
            </button>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-4 gap-4">
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
                <Briefcase className="w-5 h-5 text-blue-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">{jobs.length}</p>
                <p className="text-slate-400 text-sm">Total Jobs</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-green-500/20 flex items-center justify-center">
                <Eye className="w-5 h-5 text-green-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {jobs.reduce((acc, job) => acc + (job.metrics?.views || 0), 0)}
                </p>
                <p className="text-slate-400 text-sm">Total Views</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-purple-500/20 flex items-center justify-center">
                <Users className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {jobs.reduce((acc, job) => acc + (job.metrics?.applications || 0), 0)}
                </p>
                <p className="text-slate-400 text-sm">Applications</p>
              </div>
            </div>
          </div>

          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-amber-500/20 flex items-center justify-center">
                <BarChart3 className="w-5 h-5 text-amber-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {jobs.filter(j => j.status === 'active').length}
                </p>
                <p className="text-slate-400 text-sm">Active</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Jobs List */}
      <div className="max-w-7xl mx-auto px-4 pb-12">
        {error && (
          <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4 flex items-center gap-3 text-red-400 mb-6">
            <AlertCircle className="w-5 h-5" />
            <span>{error}</span>
          </div>
        )}

        {jobs.length === 0 ? (
          <div className="bg-slate-800/30 border border-white/10 rounded-xl p-12 text-center">
            <Briefcase className="w-12 h-12 text-slate-600 mx-auto mb-4" />
            <h3 className="text-white font-semibold text-lg mb-2">No job postings yet</h3>
            <p className="text-slate-400 mb-6">
              Create your first job posting to start attracting candidates
            </p>
            <button
              onClick={() => setShowCreateForm(true)}
              className="inline-flex items-center gap-2 px-6 py-3 bg-amber-500 hover:bg-amber-400 text-slate-900 rounded-xl font-medium"
            >
              <Plus className="w-5 h-5" />
              Post Your First Job
            </button>
          </div>
        ) : (
          <div className="space-y-4">
            {screeningReports.length > 0 && (
              <div className="rounded-xl border border-white/10 bg-slate-800/50 p-4">
                <h2 className="mb-3 text-lg font-bold text-white">Recent screening reports</h2>
                <div className="space-y-3">
                  {screeningReports.slice(0, 3).map((report) => (
                    <details key={report.id} className="rounded-lg border border-white/10 bg-slate-900 p-3">
                      <summary className="cursor-pointer text-sm font-semibold text-slate-200">
                        {report.participantName || report.participantEmail || 'Candidate'} for {report.jobTitle || 'Screening'}
                      </summary>
                      {report.recording && (
                        <div className="mt-3 rounded-lg border border-amber-400/20 bg-amber-400/10 p-3">
                          <div className="flex flex-wrap items-center justify-between gap-3">
                            <div className="flex items-start gap-2">
                              <Film className="mt-0.5 h-4 w-4 text-amber-300" />
                              <div>
                                <p className="text-sm font-semibold text-white">Recorded screening</p>
                                <p className="text-xs text-slate-300">
                                  Status: {report.recording.status}
                                  {report.recording.durationSeconds ? ` • ${Math.round(report.recording.durationSeconds)}s` : ''}
                                  {report.recording.fileSizeBytes ? ` • ${(report.recording.fileSizeBytes / 1024 / 1024).toFixed(1)} MB` : ''}
                                </p>
                                {report.recordingConsent?.consentedAt && (
                                  <p className="mt-1 inline-flex items-center gap-1 text-xs text-slate-300">
                                    <ShieldCheck className="h-3 w-3" />
                                    Consent logged {new Date(report.recordingConsent.consentedAt).toLocaleString()}
                                  </p>
                                )}
                              </div>
                            </div>
                            {report.recording.status === 'ready' && !report.recording.deletedAt && (
                              <div className="flex gap-2">
                                <button
                                  onClick={() => handleLoadRecording(report.recording!.id)}
                                  disabled={recordingActionId === report.recording.id}
                                  className="rounded-lg bg-amber-400 px-3 py-2 text-xs font-bold text-slate-950 disabled:opacity-50"
                                >
                                  {recordingActionId === report.recording.id ? 'Loading...' : 'View'}
                                </button>
                                <button
                                  onClick={() => handleDeleteRecording(report.recording!.id)}
                                  disabled={recordingActionId === report.recording.id}
                                  className="rounded-lg border border-red-400/30 px-3 py-2 text-xs font-bold text-red-200 hover:bg-red-500/10 disabled:opacity-50"
                                >
                                  Delete
                                </button>
                              </div>
                            )}
                          </div>
                          {recordingPlaybackUrls[report.recording.id] && (
                            <video
                              controls
                              src={recordingPlaybackUrls[report.recording.id]}
                              className="mt-3 aspect-video w-full max-w-2xl rounded-lg border border-white/10 bg-black"
                            />
                          )}
                        </div>
                      )}
                      <pre className="mt-3 max-h-80 overflow-auto whitespace-pre-wrap text-sm leading-relaxed text-slate-300">{report.analysis}</pre>
                    </details>
                  ))}
                </div>
              </div>
            )}
            {jobs.map(job => (
              <div
                key={job.jobId}
                className="bg-slate-800/50 border border-white/10 rounded-xl p-4"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3">
                      <h3 className="text-white font-semibold">{job.title}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        job.status === 'active'
                          ? 'bg-green-500/20 text-green-400'
                          : job.status === 'draft'
                          ? 'bg-slate-500/20 text-slate-400'
                          : job.status === 'paused'
                          ? 'bg-yellow-500/20 text-yellow-400'
                          : 'bg-red-500/20 text-red-400'
                      }`}>
                        {job.status}
                      </span>
                    </div>
                    <p className="text-slate-400 text-sm mt-1">
                      {job.location?.city && `${job.location.city}, `}
                      {job.location?.country}
                      {job.employment?.type && ` • ${job.employment.type.replace('-', ' ')}`}
                    </p>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right hidden sm:block">
                      <p className="text-white font-medium">{job.metrics?.views || 0}</p>
                      <p className="text-slate-400 text-xs">views</p>
                    </div>
                    <div className="text-right hidden sm:block">
                      <p className="text-white font-medium">{job.metrics?.applications || 0}</p>
                      <p className="text-slate-400 text-xs">applications</p>
                    </div>

                    <div className="flex items-center gap-2">
                      {job.status === 'draft' && (
                        <button
                          onClick={() => handlePublishJob(job.jobId!)}
                          className="p-2 text-green-400 hover:bg-green-400/10 rounded-lg"
                          title="Publish"
                        >
                          <Play className="w-4 h-4" />
                        </button>
                      )}

                      {(job.status === 'active' || job.status === 'paused') && (
                        <button
                          onClick={() => handleToggleJobStatus(job.jobId!, job.status!)}
                          className="p-2 text-yellow-400 hover:bg-yellow-400/10 rounded-lg"
                          title={job.status === 'paused' ? 'Resume' : 'Pause'}
                        >
                          <Pause className="w-4 h-4" />
                        </button>
                      )}

                      {job.status === 'active' && (
                        <Link
                          href={`/jobs/${job.slug}`}
                          className="p-2 text-blue-400 hover:bg-blue-400/10 rounded-lg"
                          title="View"
                        >
                          <ExternalLink className="w-4 h-4" />
                        </Link>
                      )}

                      {job.status === 'active' && (
                        <button
                          onClick={() => {
                            setScreeningJob(job);
                            setScreeningMode('auto');
                            setScreeningQuestions('');
                            setScreeningRecordingEnabled(false);
                            setScreeningUrl('');
                          }}
                          className="p-2 text-emerald-400 hover:bg-emerald-400/10 rounded-lg"
                          title="Create screening link"
                        >
                          <MessageSquare className="w-4 h-4" />
                        </button>
                      )}

                      <button
                        onClick={() => setEditingJob(job)}
                        className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg"
                        title="Edit"
                      >
                        <Edit className="w-4 h-4" />
                      </button>

                      <button
                        onClick={() => handleDeleteJob(job.jobId!)}
                        className="p-2 text-red-400 hover:bg-red-400/10 rounded-lg"
                        title="Delete"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {screeningJob && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/70 px-4">
          <div className="w-full max-w-2xl rounded-xl border border-white/10 bg-slate-900 p-6 shadow-2xl">
            <div className="mb-5 flex items-start justify-between gap-4">
              <div>
                <h2 className="text-xl font-bold text-white">Create screening link</h2>
                <p className="mt-1 text-sm text-slate-400">{screeningJob.title}</p>
              </div>
              <button
                onClick={() => setScreeningJob(null)}
                className="rounded-lg px-3 py-1 text-slate-400 hover:bg-white/10 hover:text-white"
              >
                Close
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-2 block text-sm font-medium text-slate-300">Question mode</label>
                <select
                  value={screeningMode}
                  onChange={(e) => setScreeningMode(e.target.value as 'auto' | 'exact' | 'bank')}
                  className="w-full rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                >
                  <option value="auto">Automatically follow job context</option>
                  <option value="exact">Use exact questions</option>
                  <option value="bank">Pull from question bank</option>
                </select>
              </div>

              {screeningMode !== 'auto' && (
                <div>
                  <label className="mb-2 block text-sm font-medium text-slate-300">Questions, one per line</label>
                  <textarea
                    value={screeningQuestions}
                    onChange={(e) => setScreeningQuestions(e.target.value)}
                    rows={7}
                    className="w-full resize-none rounded-xl border border-white/10 bg-slate-950 px-4 py-3 text-white focus:border-amber-500 focus:outline-none"
                  />
                </div>
              )}

              {screeningUrl && (
                <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-4">
                  <label className="mb-2 block text-sm font-medium text-emerald-200">Screening link</label>
                  <div className="flex gap-2">
                    <input readOnly value={screeningUrl} className="flex-1 rounded-lg border border-white/10 bg-slate-950 px-3 py-2 text-sm text-white" />
                    <button
                      onClick={() => navigator.clipboard?.writeText(screeningUrl)}
                      className="inline-flex items-center gap-2 rounded-lg bg-emerald-400 px-3 py-2 text-sm font-bold text-slate-950"
                    >
                      <Clipboard className="h-4 w-4" />
                      Copy
                    </button>
                  </div>
                </div>
              )}

              <label className="flex items-start gap-3 rounded-xl border border-white/10 bg-slate-950 p-4 text-sm text-slate-200">
                <input
                  type="checkbox"
                  checked={screeningRecordingEnabled}
                  onChange={(event) => setScreeningRecordingEnabled(event.target.checked)}
                  className="mt-1 h-4 w-4 accent-amber-400"
                />
                <span>
                  Require audio/video recording for this screening. Candidate consent, camera, and microphone permission will be required before the screening starts.
                </span>
              </label>

              <button
                onClick={handleCreateScreeningLink}
                disabled={isCreatingScreening || (screeningMode !== 'auto' && !screeningQuestions.trim())}
                className="inline-flex w-full items-center justify-center gap-2 rounded-xl bg-amber-400 px-6 py-3 font-bold text-slate-950 hover:bg-amber-300 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isCreatingScreening ? <Loader2 className="h-5 w-5 animate-spin" /> : <MessageSquare className="h-5 w-5" />}
                Generate 3-hour link
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

function EmployerJobsLoadingShell() {
  return (
    <div className="min-h-screen bg-slate-900">
      <div className="bg-slate-800/50 border-b border-white/10">
        <div className="max-w-7xl mx-auto px-4 py-8">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="w-12 h-12 rounded-xl bg-white/10" />
              <div>
                <div className="mb-2 h-7 w-56 rounded bg-white/10" />
                <div className="h-5 w-72 rounded bg-white/10" />
              </div>
            </div>
            <div className="hidden h-12 w-32 rounded-xl bg-white/10 sm:block" />
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 py-6">
        <div className="grid md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-[82px] rounded-xl border border-white/10 bg-slate-800/50 p-4">
              <div className="h-full rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 pb-12">
        <div className="space-y-4">
          {Array.from({ length: 4 }).map((_, index) => (
            <div key={index} className="h-[86px] rounded-xl border border-white/10 bg-slate-800/50 p-4">
              <div className="h-full rounded bg-white/10" />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
