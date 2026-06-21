import type { Metadata, Viewport } from "next";
import Script from "next/script";
import { LeisureItemsProvider } from "@/components/LeisureItemsProvider";
import { MobileBottomNav } from "@/components/MobileBottomNav";
import { NavigationProgress } from "@/components/NavigationProgress";
import { SerwistProvider } from "@/components/SerwistProvider";
import { SessionProvider } from "@/components/SessionProvider";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

const APP_BACKGROUND_LIGHT = "#f8fafc";
const APP_BACKGROUND_DARK = "#09090b";

const APP_NAME = "Fun Mun";
const APP_TITLE = "Fun Mun — Leisure Time";
const APP_DESCRIPTION = "Bookmark books, movies, series, podcasts and hobbies for your free time.";

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
      <head>
        <Script id="theme-color-bootstrap" strategy="beforeInteractive">
          {`(function(){try{var d=window.matchMedia("(prefers-color-scheme: dark)").matches;var c=d?"#09090b":"#f8fafc";document.documentElement.style.backgroundColor=c;document.querySelectorAll('meta[name="theme-color"]').forEach(function(m){m.setAttribute("content",c);});}catch(e){}})();`}
        </Script>
      </head>
      <body className="flex min-h-dvh flex-col text-foreground">
        <NavigationProgress>
          <SessionProvider>
            <ThemeProvider>
              <LeisureItemsProvider>
                <SerwistProvider swUrl="/serwist/sw.js">
                  <div className="flex min-h-dvh flex-1 flex-col pb-[calc(4.25rem+env(safe-area-inset-bottom))] sm:pb-0">
                    {children}
                  </div>
                  <MobileBottomNav />
                </SerwistProvider>
              </LeisureItemsProvider>
            </ThemeProvider>
          </SessionProvider>
        </NavigationProgress>
      </body>
    </html>
  );
}
