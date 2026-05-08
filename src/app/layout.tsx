import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { Analytics } from "@vercel/analytics/next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import "./globals.css";
import { AuthProvider } from "@/context/AuthContext";
import { MessagingProvider } from "@/context/MessagingContext";
import LazyChatWidget from "@/components/messaging/LazyChatWidget";
import ThemeApplier from "@/components/ThemeApplier";
import SiteFooter from "@/components/SiteFooter";
import AppChrome from "@/components/AppChrome";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: "LadderStar - Job Discovery & AI Interview Practice",
  description: "Browse curated external roles, publish a professional profile, and practice interviews with LadderStar.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `
              try {
                var theme = localStorage.getItem('costar-theme');
                var validThemes = ['ladderstar', 'light', 'midnight', 'high-contrast'];
                if (validThemes.indexOf(theme) !== -1) {
                  document.documentElement.dataset.theme = theme;
                }
              } catch (e) {}
            `,
          }}
        />
      </head>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeApplier />
          <MessagingProvider>
            <AppChrome>
              {children}
              <SiteFooter />
            </AppChrome>
            <LazyChatWidget />
            <div className="fixed bottom-1 right-2 text-[10px] text-gray-500/50 pointer-events-none z-50 font-mono">
              v{process.env.NEXT_PUBLIC_BUILD_TIME ? new Date(process.env.NEXT_PUBLIC_BUILD_TIME).toLocaleString('en-US', { timeZone: 'America/New_York', month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit', hour12: true }) : 'dev'}
            </div>
          </MessagingProvider>
        </AuthProvider>
        <Analytics />
        <SpeedInsights />
      </body>
    </html>
  );
}
