import { SignUp } from "@clerk/nextjs";

export default function SignUpPage() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      <SignUp
        appearance={{
          elements: {
            rootBox: "w-full",
            card: "bg-slate-800 border border-white/10 shadow-2xl",
            formButtonPrimary: "bg-gradient-to-r from-amber-400 to-orange-500 hover:opacity-90",
            footerActionLink: "text-amber-400 hover:text-amber-300",
          },
        }}
        redirectUrl="/onboarding"
      />
    </div>
  );
}
