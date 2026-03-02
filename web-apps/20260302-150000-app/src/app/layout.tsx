import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import Link from "next/link";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "ColdCraft — AI Cold Emails That Actually Get Replies",
  description:
    "Generate personalized, high-converting cold emails in seconds with AI. Stop spending 30 minutes per email. Start at $9.99/month.",
  openGraph: {
    title: "ColdCraft — AI Cold Emails That Actually Get Replies",
    description:
      "Generate personalized, high-converting cold emails in seconds with AI.",
    type: "website",
    url: "https://coldcraft.vercel.app",
  },
  twitter: {
    card: "summary_large_image",
    title: "ColdCraft — AI Cold Emails That Actually Get Replies",
    description:
      "Generate personalized, high-converting cold emails in seconds with AI.",
  },
};

function Header() {
  return (
    <header className="border-b border-border">
      <nav className="mx-auto flex max-w-6xl items-center justify-between px-6 py-4">
        <Link href="/" className="text-xl font-bold text-accent">
          ColdCraft
        </Link>
        <div className="flex items-center gap-6">
          <Link
            href="/generate"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Generator
          </Link>
          <Link
            href="/pricing"
            className="text-sm text-muted hover:text-foreground transition-colors"
          >
            Pricing
          </Link>
          <Link
            href="/pricing"
            className="rounded-lg bg-accent px-4 py-2 text-sm font-medium text-white hover:bg-accent-hover transition-colors"
          >
            Get Started
          </Link>
        </div>
      </nav>
    </header>
  );
}

function Footer() {
  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto max-w-6xl px-6 text-center text-sm text-muted">
        &copy; {new Date().getFullYear()} ColdCraft. All rights reserved.
      </div>
    </footer>
  );
}

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased min-h-screen flex flex-col`}
      >
        <Header />
        <main className="flex-1">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
