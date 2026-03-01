"use client";

import { useState } from "react";
import { TimerWidget } from "@/components/timer-widget";
import { SoundMixer } from "@/components/sound-mixer";

export default function Home() {
  const [activeSounds, setActiveSounds] = useState<string[]>([]);

  return (
    <div className="flex flex-col items-center px-4 py-12 md:py-20">
      <div className="mb-12 text-center">
        <h1 className="text-4xl font-bold tracking-tight md:text-5xl">
          Focus deeper<span className="text-blue-500">.</span>
        </h1>
        <p className="mt-3 text-lg text-[#737373]">
          AI-powered timer + ambient soundscapes for deep work.
        </p>
      </div>

      <TimerWidget activeSounds={activeSounds} />

      <div className="mt-12 w-full max-w-md">
        <SoundMixer onActiveSoundsChange={setActiveSounds} />
      </div>

      <section className="mt-24 w-full max-w-3xl">
        <h2 className="mb-8 text-center text-2xl font-semibold">
          Why DeepWork.fm
        </h2>
        <div className="grid gap-4 md:grid-cols-3">
          {[
            {
              title: "Timer + Sounds",
              desc: "No switching between apps. Timer and ambient sounds in one place.",
            },
            {
              title: "Zero Setup",
              desc: "Open the page, hit Start. No account required for basic use.",
            },
            {
              title: "Track Progress",
              desc: "See your focus sessions over time. Build the deep work habit.",
            },
          ].map((item) => (
            <div
              key={item.title}
              className="rounded-lg border border-[#1a1a1a] bg-[#111111] p-6"
            >
              <h3 className="font-semibold">{item.title}</h3>
              <p className="mt-2 text-sm text-[#737373]">{item.desc}</p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}
