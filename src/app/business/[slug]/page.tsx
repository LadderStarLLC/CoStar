"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PublicProfileView from "@/components/PublicProfileView";
import { getPublicProfileBySlugOrUid, type PublicProfile } from "@/lib/profile";

export default function BusinessPublicProfilePage() {
  const params = useParams();
  const slug = String(params.slug ?? "");
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    getPublicProfileBySlugOrUid(slug, "business")
      .then(setProfile)
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Unavailable message="Loading profile..." />;
  if (!profile) return <Unavailable message="This public business profile is unavailable." />;
  return <PublicProfileView profile={profile} />;
}

function Unavailable({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen items-center justify-center bg-[#1A1D20] px-6 text-center">
      <div>
        <h1 className="text-2xl font-bold text-white">Profile not found</h1>
        <p className="mt-2 text-[#F4F5F7]/60">{message}</p>
      </div>
    </div>
  );
}
