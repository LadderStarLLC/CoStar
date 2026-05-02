"use client";

import { useAuth } from "@/context/AuthContext";
import { useRouter } from "next/navigation";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";
import { ArrowLeft, Building2, Chrome, Github, Mail, User, Users2 } from "lucide-react";
import { accountTypeLabels, normalizeAccountType, type AccountType } from "@/lib/profile";
import BrandLogo from "@/components/BrandLogo";

const accountTypeOptions: Array<{
  type: AccountType;
  title: string;
  description: string;
  Icon: typeof User;
  accent: string;
}> = [
  {
    type: "talent",
    title: "Talent",
    description: "Build a public talent profile, practice auditions, and find aligned jobs.",
    Icon: User,
    accent: "text-[#E5B536] border-[#E5B536]/40 bg-[#E5B536]/10",
  },
  {
    type: "business",
    title: "Employer",
    description: "Create a company profile, post jobs, and manage hiring workflows.",
    Icon: Building2,
    accent: "text-[#5DC99B] border-[#5DC99B]/40 bg-[#5DC99B]/10",
  },
  {
    type: "agency",
    title: "Agency",
    description: "Represent talent, coach candidates, and publish your agency profile.",
    Icon: Users2,
    accent: "text-[#5DC99B] border-[#5DC99B]/40 bg-[#5DC99B]/10",
  },
];

export default function SignUpPage() {
  const { user, signInWithGoogle, signInWithGithub, signUpWithEmail, loading } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const requestedTypeParam = searchParams.get("type");
  const normalizedRequestedType = normalizeAccountType(requestedTypeParam);
  const requestedType = normalizedRequestedType && normalizedRequestedType !== "admin" && normalizedRequestedType !== "owner"
    ? normalizedRequestedType
    : null;

  const [showEmailForm, setShowEmailForm] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (!loading && user) {
      router.push(user.accountType === "admin" || user.accountType === "owner" ? "/admin" : user.accountType ? "/profile" : "/onboarding");
    }
  }, [user, loading, router]);

  const handleEmailSignUp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);
    try {
      await signUpWithEmail(email, password, requestedType);
    } catch (err: any) {
      setError(err.message || "Failed to create account. Please try again.");
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
          onClick={() => {
            if (showEmailForm) {
              setShowEmailForm(false);
            } else if (requestedType) {
              router.push("/sign-up");
            } else {
              router.push("/");
            }
          }}
          className="flex items-center gap-2 text-[#F4F5F7]/62 hover:text-[#5DC99B] mb-8 transition-colors"
        >
          <ArrowLeft size={20} />
          {showEmailForm ? "Back to all options" : requestedType ? "Back to account types" : "Back to Home"}
        </button>

        <div className="text-center mb-8">
          <BrandLogo size="lg" className="mx-auto mb-4" priority />
          <h1 className="text-3xl font-black tracking-tight text-[#F4F5F7] mb-2">
            {requestedType ? `Join as ${accountTypeLabels[requestedType]}` : "Choose Your Account Path"}
          </h1>
          <p className="text-[#F4F5F7]/62">
            {requestedType
              ? "This account type is permanent for this email once the account is created."
              : "Select the experience that matches how you will use LadderStar."}
          </p>
        </div>

        {requestedType ? (
          showEmailForm ? (
            <form onSubmit={handleEmailSignUp} className="space-y-4">
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
                  minLength={6}
                />
              </div>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full py-3 mt-4 ladderstar-action text-[#1A1D20] rounded-lg font-bold hover:brightness-110 transition disabled:opacity-50"
              >
                {isSubmitting ? "Creating account..." : "Sign Up"}
              </button>
            </form>
          ) : (
            <div className="space-y-4">
              <button
                onClick={() => signInWithGoogle(requestedType)}
                className="w-full py-4 ladderstar-action text-[#1A1D20] rounded-lg font-bold text-lg hover:brightness-110 transition flex items-center justify-center gap-3"
              >
                <Chrome size={24} />
                Continue with Google
              </button>
              <button
                onClick={() => signInWithGithub(requestedType)}
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
          )
        ) : (
          <div className="space-y-3">
            {accountTypeOptions.map(({ type, title, description, Icon, accent }) => (
              <button
                key={type}
                onClick={() => router.push(`/sign-up?type=${type}`)}
                className={`w-full rounded-lg border p-4 text-left transition-colors hover:border-[#5DC99B]/70 ${accent}`}
              >
                <div className="flex items-center gap-3">
                  <Icon className="h-6 w-6 shrink-0" />
                  <div>
                    <div className="font-bold text-[#F4F5F7]">{title}</div>
                    <div className="text-sm text-[#F4F5F7]/72">{description}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        )}

        <p className="mt-8 text-center text-[#F4F5F7]/50 text-sm">
          Already have an account?{" "}
          <button
            onClick={() => router.push("/sign-in")}
            className="text-[#E5B536] hover:text-[#5DC99B]"
          >
            Sign in
          </button>
        </p>
      </div>
    </div>
  );
}
