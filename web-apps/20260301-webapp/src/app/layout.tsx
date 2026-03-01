import type { Metadata } from "next";
import { Inter, JetBrains_Mono } from "next/font/google";
import "./globals.css";
import { Header } from "@/components/header";

const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const jetbrains = JetBrains_Mono({
  variable: "--font-jetbrains",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "DeepWork.fm — AI Focus Timer with Ambient Sounds",
  description:
    "Focus deeper with an AI-powered timer and ambient soundscapes. Rain, cafe, fireplace, waves — all in one app. Free to use.",
  keywords: [
    "pomodoro timer",
    "focus timer",
    "ambient sounds",
    "deep work",
    "study with me",
    "concentration",
    "productivity",
  ],
  openGraph: {
    title: "DeepWork.fm — AI Focus Timer with Ambient Sounds",
    description:
      "Focus deeper with an AI-powered timer and ambient soundscapes.",
    type: "website",
    siteName: "DeepWork.fm",
  },
  twitter: {
    card: "summary_large_image",
    title: "DeepWork.fm — AI Focus Timer",
    description:
      "Focus deeper with an AI-powered timer and ambient soundscapes.",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="dark">
      <body
        className={`${inter.variable} ${jetbrains.variable} font-sans antialiased bg-[#0a0a0a] text-[#e5e5e5]`}
      >
        <Header />
        <main className="min-h-screen">{children}</main>
        <footer className="border-t border-[#1a1a1a] py-8 text-center text-sm text-[#737373]">
          <p>&copy; 2026 DeepWork.fm. Focus deeper.</p>
        </footer>
      </body>
    </html>
  );
}
