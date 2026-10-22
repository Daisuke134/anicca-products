"use client";

import { useEffect } from "react";

export default function LiteYouTubeEmbedLoader() {
  useEffect(() => {
    void import("lite-youtube-embed");
  }, []);

  return null;
}
