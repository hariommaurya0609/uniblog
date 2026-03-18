import type { Metadata } from "next";
import "./globals.css";
import { ThemeProvider } from "@/components/ThemeProvider";

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
        {/* Prevent flash of wrong theme (FOUC) */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                try {
                  if (localStorage.getItem('uniblog-theme') === 'dark')
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
