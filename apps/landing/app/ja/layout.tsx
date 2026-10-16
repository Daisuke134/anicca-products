import React from "react";

export default function JapaneseLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div lang="ja" className="font-noto-sans-jp">
      {children}
    </div>
  );
}
