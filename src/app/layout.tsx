import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  verification: {
    google: "W7wn9aqZwrpIHcMeTIMBRDQXvuulpiGxR_Cx4USCZyI",
  },
  metadataBase: new URL("https://uniblog.site"),
  title: {
    default: "UniBlog — All Tech Blogs in One Place",
    template: "%s | UniBlog",
  },
  description:
    "Read engineering blogs from Netflix, Uber, Airbnb, Meta, GitHub, Spotify, and 100+ more companies — all in one unified feed.",
  keywords: [
    "tech blog",
    "engineering blog",
    "software engineering",
    "netflix tech blog",
    "uber engineering",
    "system design",
    "blog aggregator",
    "developer blog",
    "programming articles",
  ],
  authors: [{ name: "UniBlog" }],
  creator: "UniBlog",
  openGraph: {
    title: "UniBlog — All Tech Blogs in One Place",
    description:
      "Read engineering blogs from Netflix, Uber, Airbnb, Meta, GitHub, Spotify, and more.",
    url: "https://uniblog.site",
    siteName: "UniBlog",
    type: "website",
    locale: "en_US",
  },
  twitter: {
    card: "summary_large_image",
    title: "UniBlog — All Tech Blogs in One Place",
    description:
      "Read engineering blogs from Netflix, Uber, Airbnb, Meta, GitHub, Spotify, and more.",
    creator: "@uniblog",
  },
  alternates: {
    canonical: "https://uniblog.site",
  },
  robots: {
    index: true,
    follow: true,
    googleBot: {
      index: true,
      follow: true,
      "max-snippet": -1,
      "max-image-preview": "large",
      "max-video-preview": -1,
    },
  },
  icons: {
    icon: "/icon",
    apple: "/apple-icon",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        {/* Preconnect to external image origins for faster LCP */}
        <link rel="preconnect" href="https://storage.googleapis.com" />
        <link rel="preconnect" href="https://miro.medium.com" />
        <link rel="preconnect" href="https://engineering.atspotify.com" />
        {GA_ID && (
          <>
            <Script
              src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`}
              strategy="afterInteractive"
            />
            <Script id="google-analytics" strategy="afterInteractive">
              {`
                window.dataLayer = window.dataLayer || [];
                function gtag(){dataLayer.push(arguments);}
                gtag('js', new Date());
                gtag('config', '${GA_ID}');
              `}
            </Script>
          </>
        )}
        {/* Prevent flash of wrong theme (FOUC) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (localStorage.getItem('uniblog-theme') !== 'light')
                    document.documentElement.classList.add('dark');
                } catch(e) {}
              })();
            `,
          }}
        />
      </head>
      <body className="min-h-screen bg-gray-50 text-gray-900 antialiased transition-colors duration-200 dark:bg-gray-950 dark:text-gray-100">
        <ThemeProvider>{children}</ThemeProvider>
      </body>
    </html>
  );
}
