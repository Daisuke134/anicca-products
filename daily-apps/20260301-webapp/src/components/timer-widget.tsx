"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import {
  TimerMode,
  TIMER_PRESETS,
  formatTime,
  generateId,
  saveSession,
} from "@/lib/timer";

interface TimerWidgetProps {
  activeSounds: string[];
}

export function TimerWidget({ activeSounds }: TimerWidgetProps) {
  const [mode, setMode] = useState<TimerMode>("pomodoro25");
  const [customMinutes, setCustomMinutes] = useState(30);
  const [secondsLeft, setSecondsLeft] = useState(25 * 60);
  const [isRunning, setIsRunning] = useState(false);
  const [isBreak, setIsBreak] = useState(false);
  const startTimeRef = useRef<string | null>(null);

  const totalSeconds =
    mode === "custom"
      ? (isBreak ? 5 : customMinutes) * 60
      : (isBreak ? TIMER_PRESETS[mode].break : TIMER_PRESETS[mode].work) * 60;

  const progress = 1 - secondsLeft / totalSeconds;

  const resetTimer = useCallback(
    (newMode?: TimerMode) => {
      const m = newMode ?? mode;
      setIsRunning(false);
      setIsBreak(false);
      startTimeRef.current = null;
      const work =
        m === "custom" ? customMinutes : TIMER_PRESETS[m].work;
      setSecondsLeft(work * 60);
    },
    [mode, customMinutes]
  );

  const handleModeChange = (newMode: TimerMode) => {
    setMode(newMode);
    resetTimer(newMode);
  };

  const toggleTimer = () => {
    if (!isRunning) {
      startTimeRef.current = new Date().toISOString();
    }
    setIsRunning((prev) => !prev);
  };

  useEffect(() => {
    if (!isRunning) return;

    const interval = setInterval(() => {
      setSecondsLeft((prev) => {
        if (prev <= 1) {
          if (!isBreak) {
            const duration =
              mode === "custom" ? customMinutes : TIMER_PRESETS[mode].work;
            saveSession({
              id: generateId(),
              startedAt: startTimeRef.current ?? new Date().toISOString(),
              duration,
              completed: true,
              soundscape: activeSounds,
              createdAt: new Date().toISOString(),
            });
          }
          setIsBreak((b) => !b);
          const nextSeconds = isBreak
            ? (mode === "custom" ? customMinutes : TIMER_PRESETS[mode].work) *
              60
            : (mode === "custom" ? 5 : TIMER_PRESETS[mode].break) * 60;
          startTimeRef.current = new Date().toISOString();
          return nextSeconds;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isRunning, isBreak, mode, customMinutes, activeSounds]);

  const radius = 120;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference * (1 - progress);

  return (
    <div className="flex flex-col items-center gap-6">
      <div className="flex gap-2">
        {(Object.keys(TIMER_PRESETS) as TimerMode[]).map((m) => (
          <button
            key={m}
            onClick={() => handleModeChange(m)}
            className={`rounded-lg px-4 py-2 text-sm font-medium transition-colors ${
              mode === m
                ? "bg-blue-500 text-white"
                : "bg-[#111111] text-[#737373] hover:text-[#e5e5e5]"
            }`}
          >
            {TIMER_PRESETS[m].label}
          </button>
        ))}
      </div>

      {mode === "custom" && !isRunning && (
        <div className="flex items-center gap-3">
          <input
            type="range"
            min={5}
            max={120}
            step={5}
            value={customMinutes}
            onChange={(e) => {
              const val = parseInt(e.target.value);
              setCustomMinutes(val);
              setSecondsLeft(val * 60);
            }}
            className="w-48 accent-blue-500"
          />
          <span className="font-mono text-sm text-[#737373]">
            {customMinutes}m
          </span>
        </div>
      )}

      <div className="relative flex items-center justify-center">
        <svg width="280" height="280" className="-rotate-90">
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke="#1a1a1a"
            strokeWidth="4"
          />
          <circle
            cx="140"
            cy="140"
            r={radius}
            fill="none"
            stroke={isBreak ? "#22c55e" : "#3b82f6"}
            strokeWidth="4"
            strokeLinecap="round"
            strokeDasharray={circumference}
            strokeDashoffset={strokeDashoffset}
            className="transition-all duration-1000"
          />
        </svg>
        <div className="absolute flex flex-col items-center">
          <span className="font-mono text-6xl font-bold tracking-tight md:text-7xl">
            {formatTime(secondsLeft)}
          </span>
          <span className="mt-1 text-sm uppercase tracking-widest text-[#737373]">
            {isBreak ? "Break" : "Focus"}
          </span>
        </div>
      </div>

      <div className="flex gap-3">
        <button
          onClick={toggleTimer}
          className="rounded-lg bg-blue-500 px-8 py-3 font-medium text-white transition-colors hover:bg-blue-600"
        >
          {isRunning ? "Pause" : "Start"}
        </button>
        <button
          onClick={() => resetTimer()}
          className="rounded-lg border border-[#1a1a1a] px-6 py-3 text-[#737373] transition-colors hover:bg-[#1a1a1a] hover:text-[#e5e5e5]"
        >
          Reset
        </button>
      </div>
    </div>
  );
}
