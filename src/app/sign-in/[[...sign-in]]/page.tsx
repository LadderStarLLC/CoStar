"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Chrome, Github, Mail, ShieldCheck } from "lucide-react";
import BrandLogo from "@/components/BrandLogo";
import { isClientVercelPreview } from "@/lib/deploymentMode";
import { needsProfileOnboarding } from "@/lib/profile";

export default function SignInPage() {
  const { user, signInWithGoogle, signInWithGithub, signInWithEmail, signInWithPreview, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [previewSecret, setPreviewSecret] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const showPreviewAuth = searchParams.get("preview") === "1" && isClientVercelPreview(process.env);

  useEffect(() => {
    if (!loading && user) {
      router.push(user.accountType === "admin" || user.accountType === "owner" ? "/admin" : needsProfileOnboarding(user) ? "/onboarding" : "/profile");
    }
  }, [user, loading, router]);

  const handleEmailSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await signInWithEmail(email, password);
    } catch (err: any) {
      if (err?.code === "auth/user-disabled") {
        setError("This LadderStar account was deleted. To recreate it, choose Sign up, select a profile type, and use the same sign-in method.");
      } else {
        setError(err.message || "Failed to sign in. Please check your credentials.");
      }
      setIsSubmitting(false);
    }
  };

  const handlePreviewSignIn = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await signInWithPreview(previewSecret);
    } catch (err: any) {
      setError(err.message || "Failed to start preview session.");
      setIsSubmitting(false);
    }
  };

  if (loading || (user && !loading)) {
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

        {showPreviewAuth && (
          <form onSubmit={handlePreviewSignIn} className="mb-6 space-y-3 rounded-lg border border-[#5DC99B]/30 bg-[#5DC99B]/10 p-4">
            <div className="flex items-center gap-2 text-sm font-semibold text-[#5DC99B]">
              <ShieldCheck size={18} />
              Vercel preview testing
            </div>
            <input
              type="password"
              value={previewSecret}
              onChange={(e) => setPreviewSecret(e.target.value)}
              className="w-full rounded-lg border border-white/10 bg-black/20 p-3 text-white placeholder-white/30 focus:border-[#5DC99B] focus:outline-none"
              placeholder="Preview access secret"
              required
            />
            <button
              type="submit"
              disabled={isSubmitting || !previewSecret.trim()}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-[#5DC99B] px-4 py-3 font-bold text-[#1A1D20] transition hover:brightness-110 disabled:opacity-50"
            >
              <ShieldCheck size={18} />
              {isSubmitting ? "Starting preview..." : "Enter preview as Employer"}
            </button>
          </form>
        )}

        {showEmailForm ? (
          <form onSubmit={handleEmailSignIn} className="space-y-4">
            {error && (
              <div className="p-3 text-sm text-red-500 bg-red-500/10 border border-red-500/20 rounded-md">
                {error}
              </div>
            )}
            <div>
              <label className="block text-sm font-medium text-[#F4F5F7] mb-1">Email</label>
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full p-3 rounded-lg bg-black/20 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#5DC99B]"
                placeholder="you@example.com"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-[#F4F5F7] mb-1">Password</label>
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-3 rounded-lg bg-black/20 border border-white/10 text-white placeholder-white/30 focus:outline-none focus:border-[#5DC99B]"
                placeholder="••••••••"
              />
            </div>
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 mt-4 ladderstar-action text-[#1A1D20] rounded-lg font-bold hover:brightness-110 transition disabled:opacity-50"
            >
              {isSubmitting ? "Signing in..." : "Sign In"}
            </button>
            <button
              type="button"
              onClick={() => setShowEmailForm(false)}
              className="w-full py-3 mt-2 text-[#F4F5F7]/70 hover:text-white transition"
            >
              Back to all options
            </button>
          </form>
        ) : (
          <div className="space-y-4">
            <button
              onClick={() => signInWithGoogle()}
              className="w-full py-4 ladderstar-action text-[#1A1D20] rounded-lg font-bold text-lg hover:brightness-110 transition flex items-center justify-center gap-3"
            >
              <Chrome size={24} />
              Continue with Google
            </button>
            <button
              onClick={() => signInWithGithub()}
              className="w-full py-4 bg-[#24292e] text-white rounded-lg font-bold text-lg hover:brightness-110 transition flex items-center justify-center gap-3 border border-white/10"
            >
              <Github size={24} />
              Continue with GitHub
            </button>
            <button
              onClick={() => setShowEmailForm(true)}
              className="w-full py-4 bg-white/5 text-white rounded-lg font-bold text-lg hover:bg-white/10 transition flex items-center justify-center gap-3 border border-white/10"
            >
              <Mail size={24} />
              Continue with Email
            </button>
          </div>
        )}

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
