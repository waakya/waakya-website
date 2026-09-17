import type { Metadata, Viewport } from "next";
import { fontVariables } from "./fonts";
import { getLocale } from "@/lib/i18n/server";
import { htmlLang } from "@/lib/i18n";
import { Toaster } from "@/components/ui/sonner";
import { RegisterServiceWorker } from "@/components/waakya/register-sw";
import "./globals.css";

// head-snippet.html from the brand kit, expressed as Next metadata.
// theme_color is Neel 600 so the Android status bar matches the owner header.
export const metadata: Metadata = {
  title: {
    default: "Waakya · All your business work. One workspace.",
    template: "%s · Waakya",
  },
  description:
    "The new era of business communication. Conversations, tasks, proof, projects, documents, attendance, leave and approvals in one workspace for your team.",
  openGraph: {
    type: "website",
    siteName: "Waakya",
    locale: "en_IN",
    title: "Waakya · All your business work. One workspace.",
    description:
      "The new era of business communication. Every conversation becomes a commitment, every commitment is done, proved and kept on record.",
    url: "https://waakya.com",
  },
  twitter: {
    card: "summary_large_image",
    title: "Waakya · All your business work. One workspace.",
    description: "The new era of business communication.",
  },
  applicationName: "Waakya",
  manifest: "/manifest.webmanifest",
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL ?? "https://waakya.com"),
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "48x48" },
      { url: "/favicon.svg", type: "image/svg+xml" },
    ],
    apple: [{ url: "/apple-touch-icon.png" }],
  },
  appleWebApp: {
    capable: true,
    title: "Waakya",
    statusBarStyle: "default",
  },
  formatDetection: { telephone: false },
  // The page carries its own three languages (the switch). Without this,
  // Chrome offers to machine-translate whichever one is showing and turns
  // the brand name into a dictionary word.
  other: { google: "notranslate" },
};

export const viewport: Viewport = {
  themeColor: "#3541C4",
  width: "device-width",
  initialScale: 1,
  // Text must scale with the OS setting up to 130% (§7): never lock zoom.
  maximumScale: 5,
  viewportFit: "cover",
};

export default async function RootLayout({ children }: LayoutProps<"/">) {
  const locale = await getLocale();

  return (
    <html lang={htmlLang(locale)} className={`${fontVariables} h-full`}>
      <body className="bg-paper-50 text-ink-900 min-h-full">
        {children}
        <Toaster />
        <RegisterServiceWorker />
      </body>
    </html>
  );
}
