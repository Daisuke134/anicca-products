import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";
import { Footer } from "@/components/footer";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SignatureCraft — Professional Email Signatures in Seconds",
  description:
    "Create beautiful, professional email signatures instantly. Choose from modern templates, customize colors and layout, and copy to Gmail, Outlook, or Apple Mail with one click.",
  openGraph: {
    title: "SignatureCraft — Professional Email Signatures in Seconds",
    description:
      "Create beautiful, professional email signatures instantly. Modern templates, one-click copy for Gmail, Outlook, Apple Mail.",
    url: "https://signaturecraft.vercel.app",
    siteName: "SignatureCraft",
    type: "website",
  },
  twitter: {
    card: "summary_large_image",
    title: "SignatureCraft — Professional Email Signatures in Seconds",
    description:
      "Create beautiful, professional email signatures instantly.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Header />
        <main className="min-h-screen">{children}</main>
        <Footer />
      </body>
    </html>
  );
}
