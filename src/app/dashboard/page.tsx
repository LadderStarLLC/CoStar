"use client";

import { UserButton, useUser } from "@clerk/nextjs";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { User, Building2, Briefcase, Settings, Star, CheckCircle2, Github, Linkedin } from "lucide-react";

export default function DashboardPage() {
  const { user, isLoaded } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && !user) {
      router.push("/sign-in");
    }
  }, [user, isLoaded, router]);

  if (!isLoaded) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-900">
        <div className="text-white">Loading...</div>
      </div>
    );
  }

  if (!user) return null;

  return (
    <div className="min-h-screen bg-slate-900">
      {/* Header */}
      <header className="border-b border-white/10 bg-slate-800/50 backdrop-blur-md sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-gradient-to-br from-amber-400 to-orange-500 rounded-lg flex items-center justify-center">
              <span className="text-slate-900 font-bold">C</span>
            </div>
            <span className="text-white font-bold">CoStar</span>
          </div>
          <div className="flex items-center gap-4">
            <nav className="hidden md:flex items-center gap-6">
              <a href="#" className="text-slate-300 hover:text-white transition-colors">Jobs</a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">Companies</a>
              <a href="#" className="text-slate-300 hover:text-white transition-colors">Messages</a>
            </nav>
            <UserButton afterSignOutUrl="/" />
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-6 py-8">
        {/* Welcome */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-white mb-2">
            Welcome back, {user.firstName || "there"}!
          </h1>
          <p className="text-slate-400">Here's what's happening with your profile</p>
        </div>

        {/* Stats Grid */}
        <div className="grid md:grid-cols-4 gap-6 mb-8">
          {[
            { label: "Profile Views", value: "24", icon: User, color: "amber" },
            { label: "Job Matches", value: "8", icon: Briefcase, color: "blue" },
            { label: "Verified Accounts", value: "3", icon: CheckCircle2, color: "green" },
            { label: "Profile Strength", value: "75%", icon: Star, color: "purple" },
          ].map((stat) => (
            <div key={stat.label} className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
              <div className={`w-10 h-10 bg-${stat.color}-500/20 rounded-lg flex items-center justify-center mb-4`}>
                <stat.icon className={`text-${stat.color}-400`} size={20} />
              </div>
              <div className="text-2xl font-bold text-white mb-1">{stat.value}</div>
              <div className="text-slate-400 text-sm">{stat.label}</div>
            </div>
          ))}
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Profile Completeness */}
          <div className="md:col-span-2 bg-slate-800/50 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Profile Completeness</h2>

            <div className="space-y-4">
              {[
                { label: "Basic Information", progress: 100, complete: true },
                { label: "Work Experience", progress: 80, complete: false },
                { label: "Education", progress: 100, complete: true },
                { label: "Skills", progress: 60, complete: false },
                { label: "Social Connections", progress: 40, complete: false },
                { label: "Work Vibe Assessment", progress: 0, complete: false },
              ].map((item) => (
                <div key={item.label} className="flex items-center gap-4">
                  <div className="flex-1">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-white">{item.label}</span>
                      {item.complete ? (
                        <CheckCircle2 className="text-green-400" size={16} />
                      ) : (
                        <span className="text-slate-500 text-sm">{item.progress}%</span>
                      )}
                    </div>
                    <div className="h-2 bg-slate-700 rounded-full overflow-hidden">
                      <div
                        className="h-full bg-gradient-to-r from-amber-400 to-orange-500 rounded-full transition-all"
                        style={{ width: `${item.progress}%` }}
                      />
                    </div>
                  </div>
                </div>
              ))}
            </div>

            <button className="mt-6 w-full py-3 bg-slate-700 text-white rounded-lg font-medium hover:bg-slate-600 transition-colors">
              Complete Your Profile
            </button>
          </div>

          {/* Quick Actions */}
          <div className="bg-slate-800/50 border border-white/10 rounded-xl p-6">
            <h2 className="text-xl font-bold text-white mb-6">Quick Actions</h2>

            <div className="space-y-3">
              {[
                { icon: Github, label: "Connect GitHub", color: "amber" },
                { icon: Linkedin, label: "Import LinkedIn", color: "blue" },
                { icon: Briefcase, label: "Add Work Experience", color: "green" },
                { icon: Settings, label: "Account Settings", color: "slate" },
              ].map((action) => (
                <button
                  key={action.label}
                  className="w-full p-3 bg-slate-900 border border-white/10 rounded-lg text-white hover:border-white/30 transition-colors flex items-center gap-3"
                >
                  <action.icon className={`text-${action.color}-400`} size={18} />
                  {action.label}
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Job Matches */}
        <div className="mt-8 bg-slate-800/50 border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6">Top Job Matches</h2>

          <div className="space-y-4">
            {[
              { title: "Senior Software Engineer", company: "TechCorp", match: "94%", location: "Remote" },
              { title: "Full Stack Developer", company: "StartupXYZ", match: "87%", location: "San Francisco" },
              { title: "Staff Engineer", company: "BigTech Inc", match: "82%", location: "New York" },
            ].map((job) => (
              <div
                key={job.title}
                className="p-4 bg-slate-900 border border-white/10 rounded-lg hover:border-white/20 transition-colors flex items-center justify-between"
              >
                <div>
                  <h3 className="text-white font-semibold">{job.title}</h3>
                  <p className="text-slate-400 text-sm">{job.company} · {job.location}</p>
                </div>
                <div className="text-right">
                  <div className="text-amber-400 font-bold">{job.match}</div>
                  <div className="text-slate-500 text-sm">match</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
  );
}
