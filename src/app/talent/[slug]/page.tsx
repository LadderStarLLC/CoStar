"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import PublicProfileView from "@/components/PublicProfileView";
import { getPublicProfileBySlugOrUid, type PublicProfile } from "@/lib/profile";

import NavHeader from "@/components/NavHeader";

export default function TalentPublicProfilePage() {
  const params = useParams();
  const slug = String(params.slug ?? "");
  const [profile, setProfile] = useState<PublicProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    console.log("[Profile Fetch] Starting fetch for slug:", slug);
    getPublicProfileBySlugOrUid(slug, "talent")
      .then((res) => {
        console.log("[Profile Fetch] Success, received profile:", res);
        setProfile(res);
      })
      .catch((err) => {
        console.error("[Profile Fetch] Error:", err);
        setErrorMsg(err instanceof Error ? err.message : String(err));
      })
      .finally(() => setLoading(false));
  }, [slug]);

  if (loading) return <Unavailable message="Loading profile..." />;
  if (errorMsg) return <Unavailable message={`Error: ${errorMsg}`} />;
  if (!profile) return <Unavailable message="This public talent profile is unavailable." />;
  return <PublicProfileView profile={profile} />;
}

function Unavailable({ message }: { message: string }) {
  return (
    <div className="flex min-h-screen flex-col bg-[#1A1D20]">
      <NavHeader />
      <div className="flex flex-1 items-center justify-center px-6 text-center">
        <div>
          <h1 className="text-2xl font-bold text-white">Profile not found</h1>
          <p className="mt-2 text-[#F4F5F7]/60">{message}</p>
        </div>
      </div>
    </div>
  );
}
