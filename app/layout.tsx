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
  return (
    <html lang="en" className="dark">
      <body className="antialiased min-h-screen bg-white text-zinc-900 dark:bg-zinc-950 dark:text-zinc-50 selection:bg-primary selection:text-primary-foreground transition-colors duration-200">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
