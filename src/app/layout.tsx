import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { MessagingProvider } from "@/context/MessagingContext";
import ChatWidget from "@/components/messaging/ChatWidget";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LadderStar - Premium Job Board & Career Coaching",
  description: "Find top-tier roles, practice interviews, and get actionable career coaching on LadderStar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <AuthProvider>
          <MessagingProvider>
            {children}
            <ChatWidget />
            <div className="fixed bottom-1 right-2 text-[10px] text-gray-500/50 pointer-events-none z-50 font-mono">
              v{process.env.NEXT_PUBLIC_BUILD_TIME ? new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : 'dev'}
            </div>
          </MessagingProvider>
        </AuthProvider>
        <Analytics />
      </body>
    </html>
  );
}
