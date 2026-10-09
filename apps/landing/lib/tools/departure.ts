/**
 * Departure-time calculator + RFC 5545 .ics helpers (client-side only).
 * Source: RFC 5545 §3.1 (folding) / §3.3.11 (TEXT escape).
 */

export type DepartureInput = {
  title?: string;
  date: string; // YYYY-MM-DD
  startTime: string; // HH:MM
  travelMinutes: number;
  bufferMinutes: number;
  prepMinutes: number;
};

export type DepartureResult = {
  start: Date;
  departure: Date;
  prepStart: Date | null;
  arrival: Date; // start − buffer (= departure + travel)
  crossesPrevDay: boolean;
  timezoneName: string;
};

export function parseLocalDateTime(date: string, time: string): Date {
  const [y, mo, d] = date.split('-').map(Number);
  const [h, mi] = time.split(':').map(Number);
  return new Date(y, mo - 1, d, h, mi, 0, 0);
}

export function computeDeparture(input: DepartureInput): DepartureResult {
  const start = parseLocalDateTime(input.date, input.startTime);
  const travel = Math.max(0, Math.floor(input.travelMinutes));
  const buffer = Math.max(0, Math.floor(input.bufferMinutes));
  const prep = Math.max(0, Math.floor(input.prepMinutes));

  const departure = new Date(start.getTime() - (travel + buffer) * 60_000);
  const arrival = new Date(start.getTime() - buffer * 60_000);
  const prepStart = prep > 0 ? new Date(departure.getTime() - prep * 60_000) : null;

  const startDay = new Date(start.getFullYear(), start.getMonth(), start.getDate());
  const depDay = new Date(departure.getFullYear(), departure.getMonth(), departure.getDate());
  const crossesPrevDay = depDay.getTime() < startDay.getTime();

  let timezoneName = 'Local';
  try {
    timezoneName = Intl.DateTimeFormat().resolvedOptions().timeZone || 'Local';
  } catch {
    /* ignore */
  }

  return { start, departure, prepStart, arrival, crossesPrevDay, timezoneName };
}

export function formatHm(date: Date): string {
  const h = date.getHours();
  const m = date.getMinutes();
  return `${h}:${String(m).padStart(2, '0')}`;
}

export function formatDepartureHeadline(result: DepartureResult): string {
  const time = formatHm(result.departure);
  if (result.crossesPrevDay) return `前日 ${time} に出発`;
  return `${time} に家を出る`;
}

/** Validate ranges. Returns error message or null. */
export function validateDepartureInput(input: Partial<DepartureInput>): string | null {
  if (!input.date || !/^\d{4}-\d{2}-\d{2}$/.test(input.date)) return '日付を入力してください';
  if (!input.startTime || !/^\d{2}:\d{2}$/.test(input.startTime)) return '開始時刻を入力してください';
  const travel = Number(input.travelMinutes);
  if (!Number.isFinite(travel) || travel < 1 || travel > 600) return '移動時間は1〜600分で入力してください';
  const buffer = Number(input.bufferMinutes);
  if (!Number.isFinite(buffer) || buffer < 0 || buffer > 120) return '余裕は0〜120分で入力してください';
  const prep = Number(input.prepMinutes ?? 0);
  if (!Number.isFinite(prep) || prep < 0 || prep > 180) return '準備時間は0〜180分で入力してください';
  if (input.title && input.title.length > 60) return '予定名は60文字以内にしてください';
  return null;
}

/** Escape TEXT values per RFC 5545 §3.3.11. */
export function escapeIcsText(value: string): string {
  return value
    .replace(/\\/g, '\\\\')
    .replace(/\n/g, '\\n')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,');
}

/** Fold a content line to ≤75 octets (excluding CRLF), inserting CRLF+SPACE. */
export function foldIcsLine(line: string): string {
  const encoder = new TextEncoder();
  const bytes = encoder.encode(line);
  if (bytes.length <= 75) return line;

  const parts: string[] = [];
  let start = 0;
  let first = true;
  const decoder = new TextDecoder();

  while (start < bytes.length) {
    const limit = first ? 75 : 74; // continuation lines: 1 space + ≤74 octets content
    let end = Math.min(start + limit, bytes.length);
    // Do not split a UTF-8 multibyte sequence.
    while (end > start && (bytes[end] & 0xc0) === 0x80) end -= 1;
    if (end === start) end = Math.min(start + limit, bytes.length); // safety
    const chunk = decoder.decode(bytes.subarray(start, end));
    parts.push(first ? chunk : ` ${chunk}`);
    first = false;
    start = end;
  }
  return parts.join('\r\n');
}

export function toIcsUtcStamp(date: Date): string {
  const y = date.getUTCFullYear();
  const mo = String(date.getUTCMonth() + 1).padStart(2, '0');
  const d = String(date.getUTCDate()).padStart(2, '0');
  const h = String(date.getUTCHours()).padStart(2, '0');
  const mi = String(date.getUTCMinutes()).padStart(2, '0');
  const s = String(date.getUTCSeconds()).padStart(2, '0');
  return `${y}${mo}${d}T${h}${mi}${s}Z`;
}

export type IcsBuildOptions = {
  input: DepartureInput;
  result: DepartureResult;
  now?: Date;
  uidSeed?: string;
};

export function buildDepartureIcs(opts: IcsBuildOptions): string {
  const { input, result } = opts;
  const now = opts.now ?? new Date();
  const title = (input.title && input.title.trim()) || '予定';
  const stamp = toIcsUtcStamp(now);
  const seed = opts.uidSeed ?? `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;

  const description = escapeIcsText(
    `移動${input.travelMinutes}分＋余裕${input.bufferMinutes}分で逆算。毎回自動でやるなら Life Manager → https://aniccaai.com/lm/ja?utm_source=ics&utm_medium=tool&utm_campaign=departure_calculator`,
  );

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//aniccaai.com//departure-calculator//JA',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  const pushEvent = (summary: string, dtStart: Date, dtEnd: Date, uidSuffix: string, withAlarm: boolean) => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${seed}-${uidSuffix}@aniccaai.com`);
    lines.push(`DTSTAMP:${stamp}`);
    lines.push(`DTSTART:${toIcsUtcStamp(dtStart)}`);
    lines.push(`DTEND:${toIcsUtcStamp(dtEnd)}`);
    lines.push(`SUMMARY:${escapeIcsText(summary)}`);
    lines.push(`DESCRIPTION:${description}`);
    if (withAlarm) {
      lines.push('BEGIN:VALARM');
      lines.push('TRIGGER:-PT10M');
      lines.push('ACTION:DISPLAY');
      lines.push(`DESCRIPTION:${escapeIcsText('そろそろ出発です')}`);
      lines.push('END:VALARM');
    }
    lines.push('END:VEVENT');
  };

  pushEvent(`🚶 出発：${title}`, result.departure, result.start, 'dep', true);
  if (result.prepStart) {
    pushEvent(`🧳 準備：${title}`, result.prepStart, result.departure, 'prep', false);
  }

  lines.push('END:VCALENDAR');

  return lines.map(foldIcsLine).join('\r\n') + '\r\n';
}

/** Google Calendar template URL (opens on user side; we send nothing). */
export function buildGoogleCalendarUrl(input: DepartureInput, result: DepartureResult): string {
  const u = new URL('https://calendar.google.com/calendar/render');
  u.searchParams.set('action', 'TEMPLATE');
  u.searchParams.set('text', `🚶 出発：${(input.title && input.title.trim()) || '予定'}`);
  u.searchParams.set('dates', `${toIcsUtcStamp(result.departure)}/${toIcsUtcStamp(result.start)}`);
  u.searchParams.set(
    'details',
    `移動${input.travelMinutes}分＋余裕${input.bufferMinutes}分で逆算。毎回自動でやるなら Life Manager → https://aniccaai.com/lm/ja?utm_source=gcal&utm_medium=tool&utm_campaign=departure_calculator`,
  );
  return u.toString();
}

export function buildLmToolHref(content: string, inboundSource?: string | null): string {
  const p = new URLSearchParams({
    utm_source: 'aniccaai',
    utm_medium: 'tool',
    utm_campaign: 'departure_calculator',
    utm_content: content,
  });
  if (inboundSource) p.set('utm_term', inboundSource);
  return `/lm/ja?${p.toString()}`;
}

export function todayYmd(d = new Date()): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

export function serializeQuery(input: Pick<DepartureInput, 'date' | 'startTime' | 'travelMinutes' | 'bufferMinutes' | 'prepMinutes'>): string {
  const p = new URLSearchParams();
  p.set('t', input.startTime);
  p.set('m', String(input.travelMinutes));
  p.set('b', String(input.bufferMinutes));
  p.set('p', String(input.prepMinutes));
  p.set('d', input.date);
  return p.toString();
}

export function parseQuery(search: string): Partial<DepartureInput> {
  const q = new URLSearchParams(search.startsWith('?') ? search.slice(1) : search);
  const out: Partial<DepartureInput> = {};
  const t = q.get('t');
  const m = q.get('m');
  const b = q.get('b');
  const p = q.get('p');
  const d = q.get('d');
  if (t && /^\d{1,2}:\d{2}$/.test(t)) {
    const [hh, mm] = t.split(':');
    out.startTime = `${hh.padStart(2, '0')}:${mm}`;
  }
  if (m && Number.isFinite(Number(m))) out.travelMinutes = Number(m);
  if (b && Number.isFinite(Number(b))) out.bufferMinutes = Number(b);
  if (p && Number.isFinite(Number(p))) out.prepMinutes = Number(p);
  if (d && /^\d{4}-\d{2}-\d{2}$/.test(d)) out.date = d;
  return out;
}
