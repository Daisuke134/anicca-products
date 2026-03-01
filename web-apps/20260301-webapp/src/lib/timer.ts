export type TimerMode = "pomodoro25" | "pomodoro50" | "custom";

export const TIMER_PRESETS: Record<TimerMode, { work: number; break: number; label: string }> = {
  pomodoro25: { work: 25, break: 5, label: "25 / 5" },
  pomodoro50: { work: 50, break: 10, label: "50 / 10" },
  custom: { work: 30, break: 5, label: "Custom" },
};

export interface Session {
  id: string;
  startedAt: string;
  duration: number;
  completed: boolean;
  soundscape: string[];
  createdAt: string;
}

export function generateId(): string {
  return crypto.randomUUID();
}

export function formatTime(seconds: number): string {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m.toString().padStart(2, "0")}:${s.toString().padStart(2, "0")}`;
}

export function getSessions(): Session[] {
  if (typeof window === "undefined") return [];
  const raw = localStorage.getItem("deepwork-sessions");
  if (!raw) return [];
  return JSON.parse(raw) as Session[];
}

export function saveSession(session: Session): void {
  const sessions = getSessions();
  const updated = [session, ...sessions].slice(0, 500);
  localStorage.setItem("deepwork-sessions", JSON.stringify(updated));
}

export function getTodaySessions(): Session[] {
  const today = new Date().toISOString().slice(0, 10);
  return getSessions().filter((s) => s.createdAt.slice(0, 10) === today && s.completed);
}

export function getWeekSessions(): Session[] {
  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  return getSessions().filter(
    (s) => new Date(s.createdAt) >= weekAgo && s.completed
  );
}

export function totalMinutes(sessions: Session[]): number {
  return sessions.reduce((acc, s) => acc + s.duration, 0);
}
