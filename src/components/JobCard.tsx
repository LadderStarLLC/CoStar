'use client';

import { JobData } from '@/lib/jobs';
import { serializeCareerjetJob } from '@/lib/careerjet';
import { MapPin, Clock, DollarSign, Briefcase, Globe, Bookmark, ExternalLink } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { useAuth } from '@/context/AuthContext';

interface JobCardProps {
  job: JobData;
  showCompany?: boolean;
  onSave?: (jobId: string) => void;
  onApply?: (jobId: string) => void;
}

export default function JobCard({ job, showCompany = true, onSave, onApply }: JobCardProps) {
  const { user } = useAuth();
  const router = useRouter();
  const [saved, setSaved] = useState(false);
  const [isHovered, setIsHovered] = useState(false);

  const formatSalary = () => {
    if (!job.salary?.visible || !job.salary?.min && !job.salary?.max) return null;

    const currency = job.salary.currency || 'USD';
    const formatNumber = (num: number) => {
      if (num >= 1000) return `${(num / 1000).toFixed(0)}k`;
      return num.toString();
    };

    const min = job.salary.min ? formatNumber(job.salary.min) : '';
    const max = job.salary.max ? formatNumber(job.salary.max) : '';

    return `${currency} ${min}${min && max ? ' - ' : ''}${max}${job.salary.period === 'yearly' ? '/yr' : job.salary.period === 'monthly' ? '/mo' : '/hr'}`;
  };

  const formatDate = () => {
    if (!job.createdAt) return '';

    let date;
    if (job.createdAt.toDate) {
      date = job.createdAt.toDate();
    } else {
      date = new Date(job.createdAt);
    }

    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'Today';
    if (diffDays === 1) return 'Yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return `${Math.floor(diffDays / 30)} months ago`;
  };

  const getRemoteBadgeClass = () => {
    switch (job.location?.remotePolicy) {
      case 'remote':
        return 'bg-[#5DC99B]/12 text-[#5DC99B] border-[#5DC99B]/35';
      case 'hybrid':
        return 'bg-[#E5B536]/12 text-[#E5B536] border-[#E5B536]/35';
      case 'onsite':
        return 'bg-[#F4F5F7]/10 text-[#F4F5F7]/78 border-white/15';
      default:
        return 'bg-[#F4F5F7]/10 text-[#F4F5F7]/62 border-white/10';
    }
  };

  const handleSave = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (!user) {
      router.push('/sign-in');
      return;
    }

    setSaved(!saved);
    onSave?.(job.jobId!);
  };

  const handleApply = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    onApply?.(job.jobId!);
  };

  const salary = formatSalary();

  // Generate link - use jobId (not slug since slugs aren't persistent)
  const jobLink = job.jobId
    ? {
        pathname: `/jobs/${job.jobId}`,
        query: { job: serializeCareerjetJob(job) },
      }
    : '#';

  return (
    <Link href={jobLink}>
      <div
        className="group bg-[#262A2E] border border-white/10 rounded-lg p-5 hover:border-[#5DC99B]/55 hover:shadow-[0_18px_44px_rgba(0,0,0,0.28)] transition-all duration-300 cursor-pointer"
        onMouseEnter={() => setIsHovered(true)}
        onMouseLeave={() => setIsHovered(false)}
      >
        <div className="flex items-start gap-4">
          {/* Company Logo */}
          {showCompany && job.companyName && (
            <div className="flex-shrink-0 w-12 h-12 rounded-lg ladderstar-gold-gradient flex items-center justify-center border border-[#E5B536]/25">
              <span className="text-[#1A1D20] font-black text-lg">
                {job.companyName.charAt(0).toUpperCase()}
              </span>
            </div>
          )}

          {/* Job Info */}
          <div className="flex-1 min-w-0">
            <div className="flex items-start justify-between gap-2">
              <div>
                <h3 className="text-[#F4F5F7] font-bold text-lg group-hover:text-[#E5B536] transition-colors truncate">
                  {job.title}
                </h3>
                {showCompany && job.companyName && (
                  <p className="text-[#F4F5F7]/62 text-sm">{job.companyName}</p>
                )}
              </div>

              {/* Actions */}
              <div className="flex items-center gap-1 flex-shrink-0">
                <button
                  onClick={handleSave}
                  className={`p-2 rounded-lg transition-colors ${
                    saved
                      ? 'text-[#E5B536] bg-[#E5B536]/10'
                      : 'text-[#F4F5F7]/55 hover:text-[#E5B536] hover:bg-[#1A1D20]'
                  }`}
                  title={saved ? 'Saved' : 'Save job'}
                >
                  <Bookmark className={`w-4 h-4 ${saved ? 'fill-current' : ''}`} />
                </button>
              </div>
            </div>

            {/* Meta Info */}
            <div className="flex flex-wrap items-center gap-3 mt-3 text-sm text-[#F4F5F7]/62">
              {/* Location */}
              {(job.location?.city || job.location?.country) && (
                <div className="flex items-center gap-1">
                  <MapPin className="w-4 h-4" />
                  <span>
                    {[job.location.city, job.location.country].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}

              {/* Remote Badge */}
              {job.location?.remotePolicy && (
                <span className={`px-2 py-0.5 rounded-full text-xs font-medium border ${getRemoteBadgeClass()}`}>
                  {job.location.remotePolicy === 'remote'
                    ? 'Remote'
                    : job.location.remotePolicy === 'hybrid'
                    ? 'Hybrid'
                    : 'On-site'}
                </span>
              )}

              {/* Job Type */}
              {job.employment?.type && (
                <div className="flex items-center gap-1">
                  <Briefcase className="w-4 h-4" />
                  <span className="capitalize">{job.employment.type.replace('-', ' ')}</span>
                </div>
              )}

              {/* Experience Level */}
              {job.employment?.experienceLevel && (
                <div className="flex items-center gap-1">
                  <Globe className="w-4 h-4" />
                  <span className="capitalize">{job.employment.experienceLevel}</span>
                </div>
              )}

              {/* Salary */}
              {salary && (
                <div className="flex items-center gap-1 text-[#5DC99B]">
                  <DollarSign className="w-4 h-4" />
                  <span className="font-medium">{salary}</span>
                </div>
              )}
            </div>

            {/* Short Description */}
            {job.shortDescription && (
              <p className="text-[#F4F5F7]/64 text-sm mt-2 line-clamp-2">{job.shortDescription}</p>
            )}

            {/* Tags */}
            {job.tags && job.tags.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-3">
                {job.tags.slice(0, 4).map((tag, index) => (
                  <span
                    key={index}
                    className="px-2 py-1 bg-[#1A1D20] text-[#F4F5F7]/72 text-xs rounded-lg border border-white/5"
                  >
                    {tag}
                  </span>
                ))}
                {job.tags.length > 4 && (
                  <span className="px-2 py-1 text-[#F4F5F7]/38 text-xs">
                    +{job.tags.length - 4} more
                  </span>
                )}
              </div>
            )}

            {/* Source Badge and Category */}
            <div className="flex items-center gap-2 mt-3 flex-wrap">
              {job.category && (
                <span className="px-2 py-0.5 bg-[#5DC99B]/10 text-[#5DC99B] border border-[#5DC99B]/30 rounded-full text-xs">
                  {job.category}
                </span>
              )}
              {job.source && (
                <span className="px-2 py-0.5 bg-[#E5B536]/10 text-[#E5B536] border border-[#E5B536]/30 rounded-full text-xs">
                  {job.source}
                </span>
              )}
            </div>

            {/* Footer */}
            <div className="flex items-center justify-between mt-4 pt-3 border-t border-white/5">
              <div className="flex items-center gap-1 text-[#F4F5F7]/42 text-sm">
                <Clock className="w-4 h-4" />
                <span>{formatDate()}</span>
              </div>

              {/* Apply Button - links to external URL if available, otherwise to detail page */}
              {job.application?.url ? (
                <a
                  href={job.application.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-3 py-1.5 ladderstar-action text-[#1A1D20] rounded-lg text-sm font-bold transition hover:brightness-110"
                >
                  Apply
                  <ExternalLink className="w-3 h-3" />
                </a>
              ) : (
                <span
                  onClick={(e) => e.stopPropagation()}
                  className="flex items-center gap-1 px-3 py-1.5 bg-[#1A1D20] hover:border-[#5DC99B] border border-white/10 text-[#F4F5F7] rounded-lg text-sm font-medium transition-colors cursor-pointer"
                >
                  View Details
                  <ExternalLink className="w-3 h-3" />
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </Link>
  );
}
