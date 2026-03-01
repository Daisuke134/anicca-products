"use client";

import { useEffect, useState } from "react";
import {
  Session,
  getSessions,
  getTodaySessions,
  getWeekSessions,
  totalMinutes,
} from "@/lib/timer";

export default function StatsPage() {
  const [todaySessions, setTodaySessions] = useState<Session[]>([]);
  const [weekSessions, setWeekSessions] = useState<Session[]>([]);
  const [allSessions, setAllSessions] = useState<Session[]>([]);

  useEffect(() => {
    setTodaySessions(getTodaySessions());
    setWeekSessions(getWeekSessions());
    setAllSessions(getSessions().filter((s) => s.completed));
  }, []);

  const weekDays = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - (6 - i));
    return d.toISOString().slice(0, 10);
  });

  const dayMinutes = weekDays.map((day) =>
    totalMinutes(weekSessions.filter((s) => s.createdAt.slice(0, 10) === day))
  );

  const maxMinutes = Math.max(...dayMinutes, 1);

  return (
    <div className="mx-auto max-w-3xl px-4 py-12">
      <h1 className="mb-8 text-3xl font-bold">Focus Stats</h1>

      <div className="mb-8 grid gap-4 md:grid-cols-3">
        {[
          {
            label: "Today",
            value: `${totalMinutes(todaySessions)}m`,
            sub: `${todaySessions.length} sessions`,
          },
          {
            label: "This Week",
            value: `${totalMinutes(weekSessions)}m`,
            sub: `${weekSessions.length} sessions`,
          },
          {
            label: "All Time",
            value: `${totalMinutes(allSessions)}m`,
            sub: `${allSessions.length} sessions`,
          },
        ].map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-[#1a1a1a] bg-[#111111] p-6"
          >
            <p className="text-sm text-[#737373]">{stat.label}</p>
            <p className="mt-1 font-mono text-3xl font-bold">{stat.value}</p>
            <p className="mt-1 text-xs text-[#737373]">{stat.sub}</p>
          </div>
        ))}
      </div>

      <div className="rounded-lg border border-[#1a1a1a] bg-[#111111] p-6">
        <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-[#737373]">
          Last 7 Days
        </h2>
        <div className="flex items-end gap-2" style={{ height: 160 }}>
          {weekDays.map((day, i) => (
            <div key={day} className="flex flex-1 flex-col items-center gap-1">
              <div
                className="w-full rounded-t bg-blue-500 transition-all"
                style={{
                  height: `${(dayMinutes[i] / maxMinutes) * 140}px`,
                  minHeight: dayMinutes[i] > 0 ? 4 : 0,
                }}
              />
              <span className="text-xs text-[#737373]">
                {new Date(day + "T12:00:00").toLocaleDateString("en", {
                  weekday: "short",
                })}
              </span>
            </div>
          ))}
        </div>
      </div>

      {allSessions.length > 0 && (
        <div className="mt-8 rounded-lg border border-[#1a1a1a] bg-[#111111] p-6">
          <h2 className="mb-4 text-sm font-medium uppercase tracking-widest text-[#737373]">
            Recent Sessions
          </h2>
          <div className="space-y-2">
            {allSessions.slice(0, 10).map((session) => (
              <div
                key={session.id}
                className="flex items-center justify-between rounded border border-[#1a1a1a] px-4 py-2"
              >
                <span className="text-sm text-[#737373]">
                  {new Date(session.createdAt).toLocaleDateString("en", {
                    month: "short",
                    day: "numeric",
                    hour: "2-digit",
                    minute: "2-digit",
                  })}
                </span>
                <span className="font-mono text-sm">
                  {session.duration}m
                </span>
                <span className="text-xs text-[#737373]">
                  {session.soundscape.length > 0
                    ? session.soundscape.join(", ")
                    : "No sounds"}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}

      {allSessions.length === 0 && (
        <p className="mt-8 text-center text-[#737373]">
          No sessions yet. Start a timer to track your focus.
        </p>
      )}
    </div>
  );
}
