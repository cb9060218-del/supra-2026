import type { Metadata, Viewport } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "SUPRA SAEINDIA 2026 | Enterprise SaaS",
  description: "Sponsor, Guest, Benefits, and Gatepass Management Platform for SUPRA SAEINDIA Student Formula 2026",
  manifest: "/manifest.json",
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: "SUPRA 2026",
  },
};

export const viewport: Viewport = {
  themeColor: "#09090b",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

interface RootLayoutProps {
  children: React.ReactNode;
}

export default function RootLayout({ children }: RootLayoutProps) {
  const hasEnv = process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 selection:bg-primary selection:text-primary-foreground transition-colors duration-200">
        {hasEnv ? (
          <Providers>{children}</Providers>
        ) : (
          <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-zinc-100 text-center">
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/50 p-8 max-w-md shadow-xl text-center space-y-4">
              <div className="h-12 w-12 rounded-xl bg-red-950/50 border border-red-900/50 flex items-center justify-center text-red-500 font-bold mx-auto text-xl">
                ⚠️
              </div>
              <h1 className="text-xl font-bold text-zinc-100">Supabase Config Required</h1>
              <p className="text-xs text-zinc-400 leading-relaxed">
                It looks like the Supabase environment variables are missing from your Vercel Project Settings.
              </p>
              <div className="bg-zinc-950 border border-zinc-850 rounded-lg p-4 text-left font-mono text-[10px] text-zinc-400 space-y-2">
                <span className="block text-zinc-500 font-bold text-[9px] uppercase tracking-wider mb-1">Required Variables:</span>
                <div className="flex items-center justify-between">
                  <span>NEXT_PUBLIC_SUPABASE_URL</span>
                  <span className="text-red-500">Missing</span>
                </div>
                <div className="flex items-center justify-between">
                  <span>NEXT_PUBLIC_SUPABASE_ANON_KEY</span>
                  <span className="text-red-500">Missing</span>
                </div>
              </div>
              <p className="text-[10px] text-zinc-500 leading-normal">
                After adding these in Vercel Settings &rarr; Environment Variables, trigger a new deployment to apply them.
              </p>
            </div>
          </div>
        )}
      </body>
    </html>
  );
}
