import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Anicca App Store Screenshots",
  description: "Screenshot generator for Anicca iOS app",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="h-full antialiased">
      <body className="min-h-full flex flex-col" style={{ fontFamily: '-apple-system, "SF Pro Display", system-ui, sans-serif' }}>
        {children}
      </body>
    </html>
  );
}
