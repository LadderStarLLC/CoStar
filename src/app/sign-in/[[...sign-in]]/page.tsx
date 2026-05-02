"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { ArrowLeft, Chrome } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";

export default function SignInPage() {
  const { user, signInWithGoogle, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) {
      router.push(user.accountType === "admin" || user.accountType === "owner" ? "/admin" : user.accountType ? "/profile" : "/onboarding");
    }
  }, [user, loading, router]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center ladderstar-surface">
        <div className="text-[#F4F5F7]">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center ladderstar-surface px-4">
      <div className="w-full max-w-md p-8 bg-[#262A2E]/90 border border-white/10 rounded-lg shadow-2xl shadow-black/30">
        <button
          onClick={() => router.push("/")}
          className="flex items-center gap-2 text-[#F4F5F7]/62 hover:text-[#5DC99B] mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          Back to Home
        </button>

        <div className="text-center mb-8">
          <BrandLogo size="lg" className="mx-auto mb-4" priority />
          <h1 className="text-3xl font-black tracking-tight text-[#F4F5F7] mb-2">Welcome Back</h1>
          <p className="text-[#F4F5F7]/62">Sign in to continue to LadderStar</p>
        </div>

        <button
          onClick={signInWithGoogle}
          className="w-full py-4 ladderstar-action text-[#1A1D20] rounded-lg font-bold text-lg hover:brightness-110 transition flex items-center justify-center gap-3"
        >
          <Chrome size={24} />
          Continue with Google
        </button>

        <p className="mt-8 text-center text-[#F4F5F7]/50 text-sm">
          Don&apos;t have an account?{" "}
          <button
            onClick={() => router.push("/sign-up")}
            className="text-[#E5B536] hover:text-[#5DC99B]"
          >
            Sign up
          </button>
        </p>
      </div>
    </div>
  );
}
