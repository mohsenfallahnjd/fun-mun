import type { Metadata, Viewport } from "next";
import { SerwistProvider } from "@/components/SerwistProvider";
import { SessionProvider } from "@/components/SessionProvider";
import "./globals.css";

const APP_NAME = "Fun Mun";
const APP_TITLE = "Fun Mun — Leisure Time";
const APP_DESCRIPTION = "Bookmark books, movies, series, podcasts and places for your free time.";

export const metadata: Metadata = {
  applicationName: APP_NAME,
  title: {
    default: APP_TITLE,
    template: `%s · ${APP_NAME}`,
  },
  description: APP_DESCRIPTION,
  appleWebApp: {
    capable: true,
    statusBarStyle: "default",
    title: APP_NAME,
  },
  formatDetection: {
    telephone: false,
  },
  icons: {
    icon: [{ url: "/icon", type: "image/png", sizes: "32x32" }],
    apple: [{ url: "/apple-icon", type: "image/png", sizes: "180x180" }],
  },
};

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#b85c38" },
    { media: "(prefers-color-scheme: dark)", color: "#12100e" },
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col bg-background text-foreground">
        <SessionProvider>
          <SerwistProvider swUrl="/serwist/sw.js">{children}</SerwistProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
