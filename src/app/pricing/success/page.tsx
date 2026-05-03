import Link from "next/link";
import { CheckCircle2, Settings, User } from "lucide-react";
import NavHeader from "@/components/NavHeader";
import { syncCheckoutSession } from "@/lib/stripeBilling";

export const dynamic = "force-dynamic";

type PricingSuccessPageProps = {
  searchParams: {
    session_id?: string;
  };
};

export default async function PricingSuccessPage({ searchParams }: PricingSuccessPageProps) {
  let syncError: string | null = null;
  if (searchParams.session_id) {
    try {
      await syncCheckoutSession(searchParams.session_id);
    } catch (error) {
      syncError = error instanceof Error ? error.message : "Unable to sync checkout.";
    }
  }

  return (
    <div className="min-h-screen bg-[#1A1D20] text-[#F4F5F7]">
      <NavHeader />
      <main className="mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg ladderstar-gold-gradient">
          <CheckCircle2 className="h-8 w-8 text-[#1A1D20]" />
        </div>
        <h1 className="mt-6 text-4xl font-black tracking-tight">Checkout complete</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[#F4F5F7]/70">
          Stripe confirmed your subscription checkout. Your LadderStar account is ready to continue from your profile or settings.
        </p>
        {syncError && (
          <p className="mt-4 rounded-lg border border-[#E5B536]/35 bg-[#262A2E] px-4 py-3 text-sm leading-6 text-[#E5B536]">
            Payment succeeded, but LadderStar could not sync the subscription automatically: {syncError}
          </p>
        )}
        <div className="mt-8 flex flex-col gap-3 sm:flex-row">
          <Link
            href="/profile"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg ladderstar-action px-5 py-3 font-bold text-[#1A1D20] transition hover:brightness-110"
          >
            <User className="h-4 w-4" />
            Go to profile
          </Link>
          <Link
            href="/dashboard/settings"
            className="inline-flex min-h-12 items-center justify-center gap-2 rounded-lg border border-[#5DC99B]/35 bg-[#262A2E] px-5 py-3 font-bold text-[#F4F5F7] transition hover:border-[#5DC99B] hover:text-[#5DC99B]"
          >
            <Settings className="h-4 w-4" />
            Account settings
          </Link>
        </div>
      </main>
    </div>
  );
}
