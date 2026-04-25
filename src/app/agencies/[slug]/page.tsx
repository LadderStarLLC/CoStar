"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { Loader2 } from "lucide-react";
import PublicProfileView from "@/components/PublicProfileView";
import { getPublicProfileBySlugOrUid, type UserProfile } from "@/lib/profile";

export default function PublicAgencyProfilePage() {
  const params = useParams();
  const slug = params.slug as string;
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    getPublicProfileBySlugOrUid(slug, "agency")
      .then(setProfile)
      .catch(() => setProfile(null))
      .finally(() => setIsLoading(false));
  }, [slug]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-900 px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Agency not found</h1>
          <p className="mt-2 text-slate-400">This public agency profile is unavailable.</p>
        </div>
      </div>
    );
  }

  return <PublicProfileView profile={profile} />;
}
