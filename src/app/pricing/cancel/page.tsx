import Link from "next/link";
import { ArrowLeft, WalletCards } from "lucide-react";
import NavHeader from "@/components/NavHeader";

export default function PricingCancelPage() {
  return (
    <div className="min-h-screen bg-[#1A1D20] text-[#F4F5F7]">
      <NavHeader />
      <main className="mx-auto flex max-w-3xl flex-col items-center px-6 py-20 text-center">
        <div className="flex h-16 w-16 items-center justify-center rounded-lg border border-[#5DC99B]/35 bg-[#262A2E]">
          <WalletCards className="h-8 w-8 text-[#5DC99B]" />
        </div>
        <h1 className="mt-6 text-4xl font-black tracking-tight">Checkout canceled</h1>
        <p className="mt-4 max-w-2xl text-lg leading-8 text-[#F4F5F7]/70">
          No payment was processed. You can return to pricing and choose a plan whenever you are ready.
        </p>
        <Link
          href="/pricing"
          className="mt-8 inline-flex min-h-12 items-center justify-center gap-2 rounded-lg ladderstar-action px-5 py-3 font-bold text-[#1A1D20] transition hover:brightness-110"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to pricing
        </Link>
      </main>
    </div>
  );
}
