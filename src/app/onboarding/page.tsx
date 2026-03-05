"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import { User, Building2, ArrowRight, Check, Github, Linkedin, Mail, Phone } from "lucide-react";

export default function OnboardingPage() {
  const router = useRouter();
  const { user, loading: authLoading } = useAuth();
  const [step, setStep] = useState(1);
  const [accountType, setAccountType] = useState<"user" | "business" | null>(null);

  useEffect(() => {
    if (!authLoading && !user) {
      router.push("/sign-in");
    }
  }, [user, authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  const steps = [
    { num: 1, title: "Account Type" },
    { num: 2, title: "Basic Info" },
    { num: 3, title: "Connect Accounts" },
    { num: 4, title: "Work Vibe" },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-12 px-6">
      <div className="max-w-2xl mx-auto">
        {/* Progress Steps */}
        <div className="flex items-center justify-center gap-4 mb-12">
          {steps.map((s, i) => (
            <div key={s.num} className="flex items-center">
              <div
                className={`w-10 h-10 rounded-full flex items-center justify-center font-semibold transition-colors ${
                  step >= s.num
                    ? "bg-amber-500 text-slate-900"
                    : "bg-slate-700 text-slate-400"
                }`}
              >
                {step > s.num ? <Check size={20} /> : s.num}
              </div>
              {i < steps.length - 1 && (
                <div className={`w-12 h-0.5 mx-2 ${step > s.num ? "bg-amber-500" : "bg-slate-700"}`} />
              )}
            </div>
          ))}
        </div>

        {/* Step 1: Account Type */}
        {step === 1 && (
          <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Choose Your Path</h1>
            <p className="text-slate-400 mb-8">Select how you want to use CoStar</p>

            <div className="space-y-4">
              <button
                onClick={() => setAccountType("user")}
                className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                  accountType === "user"
                    ? "border-amber-500 bg-amber-500/10"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-amber-500/20 rounded-xl flex items-center justify-center">
                    <User className="text-amber-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Job Seeker</h3>
                    <p className="text-slate-400">Build your profile and get matched with your dream job</p>
                  </div>
                </div>
              </button>

              <button
                onClick={() => setAccountType("business")}
                className={`w-full p-6 rounded-xl border-2 text-left transition-all ${
                  accountType === "business"
                    ? "border-blue-500 bg-blue-500/10"
                    : "border-white/10 hover:border-white/30"
                }`}
              >
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-blue-500/20 rounded-xl flex items-center justify-center">
                    <Building2 className="text-blue-400" size={24} />
                  </div>
                  <div>
                    <h3 className="text-xl font-semibold text-white">Employer</h3>
                    <p className="text-slate-400">Find and hire top talent with AI assistance</p>
                  </div>
                </div>
              </button>
            </div>

            <button
              onClick={() => setStep(2)}
              disabled={!accountType}
              className="mt-8 w-full py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 rounded-xl font-bold text-lg hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
            >
              Continue <ArrowRight size={20} />
            </button>
          </div>
        )}

        {/* Step 2: Basic Info */}
        {step === 2 && (
          <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Tell Us About Yourself</h1>
            <p className="text-slate-400 mb-8">Let's get the basics down</p>

            <div className="space-y-4">
              <div>
                <label className="block text-white mb-2 font-medium">Full Name</label>
                <input
                  type="text"
                  placeholder="John Doe"
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white mb-2 font-medium">Headline</label>
                <input
                  type="text"
                  placeholder="Senior Software Engineer at TechCorp"
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>

              <div>
                <label className="block text-white mb-2 font-medium">Location</label>
                <input
                  type="text"
                  placeholder="San Francisco, CA"
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(1)}
                className="flex-1 py-4 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Continue <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 3: Connect Accounts */}
        {step === 3 && (
          <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Connect Your Accounts</h1>
            <p className="text-slate-400 mb-8">Import your professional presence</p>

            <div className="space-y-4">
              {[
                { icon: Github, name: "GitHub", desc: "Showcase your code and contributions", color: "amber" },
                { icon: Linkedin, name: "LinkedIn", desc: "Import your professional network", color: "blue" },
                { icon: Mail, name: "Email", desc: "Verify your email address", color: "green" },
              ].map((account) => (
                <button
                  key={account.name}
                  className="w-full p-4 bg-slate-900 border border-white/10 rounded-xl hover:border-white/30 transition-colors flex items-center gap-4"
                >
                  <div className={`w-10 h-10 bg-${account.color}-500/20 rounded-lg flex items-center justify-center`}>
                    <account.icon className={`text-${account.color}-400`} size={20} />
                  </div>
                  <div className="flex-1 text-left">
                    <h3 className="text-white font-semibold">{account.name}</h3>
                    <p className="text-slate-400 text-sm">{account.desc}</p>
                  </div>
                  <span className="text-slate-500">Connect</span>
                </button>
              ))}
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(2)}
                className="flex-1 py-4 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => setStep(4)}
                className="flex-1 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Continue <ArrowRight size={20} />
              </button>
            </div>
          </div>
        )}

        {/* Step 4: Work Vibe */}
        {step === 4 && (
          <div className="bg-slate-800/50 border border-white/10 rounded-2xl p-8">
            <h1 className="text-3xl font-bold text-white mb-2">Discover Your Work Vibe</h1>
            <p className="text-slate-400 mb-8">Help us understand what makes you tick</p>

            <div className="space-y-6">
              <div>
                <label className="block text-white mb-3 font-medium">Work Style</label>
                <div className="grid grid-cols-2 gap-3">
                  {["Remote", "Hybrid", "In-Office", "Flexible"].map((style) => (
                    <button
                      key={style}
                      className="py-3 bg-slate-900 border border-white/10 rounded-lg text-white hover:border-amber-500 transition-colors"
                    >
                      {style}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-white mb-3 font-medium">Company Culture Preference</label>
                <div className="grid grid-cols-2 gap-3">
                  {["Startup", "Enterprise", "Remote-First", "Mission-Driven"].map((culture) => (
                    <button
                      key={culture}
                      className="py-3 bg-slate-900 border border-white/10 rounded-lg text-white hover:border-amber-500 transition-colors"
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
                  placeholder="Tell us about your values, goals, and what you're looking for..."
                  className="w-full px-4 py-3 bg-slate-900 border border-white/10 rounded-xl text-white placeholder-slate-500 focus:border-amber-500 focus:outline-none resize-none"
                />
              </div>
            </div>

            <div className="flex gap-4 mt-8">
              <button
                onClick={() => setStep(3)}
                className="flex-1 py-4 bg-slate-700 text-white rounded-xl font-bold hover:bg-slate-600 transition-colors"
              >
                Back
              </button>
              <button
                onClick={() => router.push("/dashboard")}
                className="flex-1 py-4 bg-gradient-to-r from-amber-400 to-orange-500 text-slate-900 rounded-xl font-bold hover:opacity-90 transition-opacity flex items-center justify-center gap-2"
              >
                Complete Setup <Check size={20} />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
