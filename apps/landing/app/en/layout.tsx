import React from "react";

export default function EnglishLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div lang="en" className="font-sans">
      {children}
    </div>
  );
}
