"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface Sound {
  id: string;
  label: string;
  icon: string;
  frequency: number;
  type: OscillatorType | "noise";
}

const SOUNDS: Sound[] = [
  { id: "rain", label: "Rain", icon: "🌧", frequency: 200, type: "noise" },
  { id: "cafe", label: "Café", icon: "☕", frequency: 300, type: "noise" },
  { id: "fire", label: "Fire", icon: "🔥", frequency: 150, type: "noise" },
  { id: "waves", label: "Waves", icon: "🌊", frequency: 100, type: "noise" },
  { id: "white", label: "White Noise", icon: "📻", frequency: 0, type: "noise" },
];

interface SoundState {
  active: boolean;
  volume: number;
}

interface SoundMixerProps {
  onActiveSoundsChange: (sounds: string[]) => void;
}

function createNoiseNode(
  ctx: AudioContext,
  soundId: string
): AudioBufferSourceNode {
  const bufferSize = ctx.sampleRate * 2;
  const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
  const data = buffer.getChannelData(0);

  for (let i = 0; i < bufferSize; i++) {
    switch (soundId) {
      case "rain":
        data[i] = (Math.random() * 2 - 1) * (Math.random() > 0.97 ? 0.8 : 0.15);
        break;
      case "cafe":
        data[i] = (Math.random() * 2 - 1) * 0.08 + Math.sin(i * 0.001) * 0.03;
        break;
      case "fire":
        data[i] = (Math.random() * 2 - 1) * (0.1 + Math.random() * 0.15);
        break;
      case "waves":
        data[i] =
          Math.sin(i * 0.0003) * 0.3 * (0.5 + Math.sin(i * 0.00005) * 0.5) +
          (Math.random() * 2 - 1) * 0.05;
        break;
      default:
        data[i] = (Math.random() * 2 - 1) * 0.2;
    }
  }

  const source = ctx.createBufferSource();
  source.buffer = buffer;
  source.loop = true;
  return source;
}

export function SoundMixer({ onActiveSoundsChange }: SoundMixerProps) {
  const [sounds, setSounds] = useState<Record<string, SoundState>>(
    Object.fromEntries(SOUNDS.map((s) => [s.id, { active: false, volume: 0.5 }]))
  );
  const audioCtxRef = useRef<AudioContext | null>(null);
  const nodesRef = useRef<
    Record<string, { source: AudioBufferSourceNode; gain: GainNode }>
  >({});

  const getCtx = useCallback(() => {
    if (!audioCtxRef.current) {
      audioCtxRef.current = new AudioContext();
    }
    return audioCtxRef.current;
  }, []);

  const toggleSound = useCallback(
    (id: string) => {
      setSounds((prev) => {
        const next = { ...prev, [id]: { ...prev[id], active: !prev[id].active } };
        const activeSounds = Object.entries(next)
          .filter(([, v]) => v.active)
          .map(([k]) => k);
        onActiveSoundsChange(activeSounds);

        if (!prev[id].active) {
          const ctx = getCtx();
          const source = createNoiseNode(ctx, id);
          const gain = ctx.createGain();
          gain.gain.value = prev[id].volume;
          source.connect(gain);
          gain.connect(ctx.destination);
          source.start();
          nodesRef.current[id] = { source, gain };
        } else {
          const node = nodesRef.current[id];
          if (node) {
            node.source.stop();
            delete nodesRef.current[id];
          }
        }

        return next;
      });
    },
    [getCtx, onActiveSoundsChange]
  );

  const changeVolume = useCallback((id: string, volume: number) => {
    setSounds((prev) => ({
      ...prev,
      [id]: { ...prev[id], volume },
    }));
    const node = nodesRef.current[id];
    if (node) {
      node.gain.gain.value = volume;
    }
  }, []);

  useEffect(() => {
    return () => {
      Object.values(nodesRef.current).forEach((node) => {
        node.source.stop();
      });
    };
  }, []);

  return (
    <div className="w-full max-w-md">
      <h3 className="mb-4 text-center text-sm font-medium uppercase tracking-widest text-[#737373]">
        Ambient Sounds
      </h3>
      <div className="grid grid-cols-5 gap-2 sm:gap-3">
        {SOUNDS.map((sound) => (
          <div key={sound.id} className="flex flex-col items-center gap-2">
            <button
              onClick={() => toggleSound(sound.id)}
              className={`flex h-14 w-14 items-center justify-center rounded-xl text-2xl transition-all ${
                sounds[sound.id].active
                  ? "bg-blue-500/20 ring-1 ring-blue-500"
                  : "bg-[#111111] hover:bg-[#1a1a1a]"
              }`}
            >
              {sound.icon}
            </button>
            <span className="text-xs text-[#737373]">{sound.label}</span>
            {sounds[sound.id].active && (
              <input
                type="range"
                min={0}
                max={1}
                step={0.05}
                value={sounds[sound.id].volume}
                onChange={(e) =>
                  changeVolume(sound.id, parseFloat(e.target.value))
                }
                className="w-14 accent-blue-500"
              />
            )}
          </div>
        ))}
      </div>
    </div>
  );
}
