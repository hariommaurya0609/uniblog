import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

const GA_ID = process.env.NEXT_PUBLIC_GA_ID;

export const metadata: Metadata = {
  title: "UniBlog — All Tech Blogs in One Place",
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
  ],
  openGraph: {
    title: "UniBlog — All Tech Blogs in One Place",
    description:
      "Read engineering blogs from Netflix, Uber, Airbnb, Meta, GitHub, Spotify, and more.",
    type: "website",
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
