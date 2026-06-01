import type { Metadata, Viewport } from "next";
import { LeisureItemsProvider } from "@/components/LeisureItemsProvider";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { SerwistProvider } from "@/components/SerwistProvider";
import { SessionProvider } from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const APP_BACKGROUND_LIGHT = "#f8fafc";
const APP_BACKGROUND_DARK = "#09090b";

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
    statusBarStyle: "black-translucent",
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
    { media: "(prefers-color-scheme: light)", color: APP_BACKGROUND_LIGHT },
    { media: "(prefers-color-scheme: dark)", color: APP_BACKGROUND_DARK },
  ],
  userScalable: false,
  viewportFit: "cover",
  width: "device-width",
  initialScale: 1,
  maximumScale: 1,
  minimumScale: 1,
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="flex min-h-dvh flex-col text-foreground">
        <SessionProvider>
          <ThemeProvider>
            <LeisureItemsProvider>
              <SerwistProvider swUrl="/serwist/sw.js">
                <div className="flex min-h-dvh flex-1 flex-col pt-[env(safe-area-inset-top)] pb-[calc(4.25rem+env(safe-area-inset-bottom))] sm:pb-0">
                  {children}
                </div>
                <MobileBottomNav />
              </SerwistProvider>
            </LeisureItemsProvider>
          </ThemeProvider>
        </SessionProvider>
      </body>
    </html>
  );
}
