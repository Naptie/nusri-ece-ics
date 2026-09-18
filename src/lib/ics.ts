import { type Course, type DayCode, holidays, TZID } from './courses.ts';

function pad(n: number): string {
  return n < 10 ? `0${n}` : `${n}`;
}

/** Asia/Shanghai has no DST; fixed offset since 1991. */
const TZ_OFFSET_MINUTES = 480;

export type DateParts = { y: number; m: number; d: number };
export type TimeParts = { hh: number; mm: number };

/** Parses `YYYY-MM-DD` into `{y, m, d}`. */
export function parseDate(s: string): DateParts {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(s);
  if (!m) throw new Error(`Invalid date: ${s}`);
  return { y: +m[1], m: +m[2], d: +m[3] };
}

/** Parses `HH:MM` (24h) into `{hh, mm}`. */
export function parseTime(s: string): TimeParts {
  const m = /^(\d{1,2}):(\d{2})$/.exec(s);
  if (!m) throw new Error(`Invalid time: ${s}`);
  return { hh: +m[1], mm: +m[2] };
}

/** Compares two `{y,m,d}` objects. */
export function compareDate(a: DateParts, b: DateParts): number {
  return a.y - b.y || a.m - b.m || a.d - b.d;
}

export function addDays(d: DateParts, n: number): DateParts {
  const dt = new Date(Date.UTC(d.y, d.m - 1, d.d + n));
  return { y: dt.getUTCFullYear(), m: dt.getUTCMonth() + 1, d: dt.getUTCDate() };
}

/** 0 = Monday … 6 = Sunday. */
export function dayOfWeek(d: DateParts): DayCode {
  return ((new Date(Date.UTC(d.y, d.m - 1, d.d)).getUTCDay() + 6) % 7) as DayCode;
}

export function toIsoDate(d: DateParts): string {
  return `${d.y}-${pad(d.m)}-${pad(d.d)}`;
}

/** Formats a local wall-clock date-time as ICS `YYYYMMDDTHHMMSS`. */
export function formatIcsLocal(d: DateParts, t?: TimeParts): string {
  return `${d.y}${pad(d.m)}${pad(d.d)}T${pad(t?.hh ?? 0)}${pad(t?.mm ?? 0)}00`;
}

/** Converts a local (UTC+8) date-time to an ICS UTC stamp (`…Z`). */
export function localToUtcStamp(d: DateParts, t: TimeParts & { ss?: number }): string {
  const ms = Date.UTC(d.y, d.m - 1, d.d, t.hh, t.mm, t.ss ?? 0) - TZ_OFFSET_MINUTES * 60_000;
  const dt = new Date(ms);
  return `${dt.getUTCFullYear()}${pad(dt.getUTCMonth() + 1)}${pad(dt.getUTCDate())}T${pad(
    dt.getUTCHours()
  )}${pad(dt.getUTCMinutes())}${pad(dt.getUTCSeconds())}Z`;
}

/**
 * RFC 5545 §3.3.10 — lines longer than 75 octets must be folded
 * with CRLF followed by a single space.
 */
export function foldLine(line: string): string {
  const out: string[] = [];
  let len = 0;
  for (const ch of line) {
    const w = (ch.codePointAt(0) ?? 0) > 0xffff ? 2 : 1;
    if (len + w > 74) {
      out.push('\r\n ');
      len = 1;
    }
    out.push(ch);
    len += w;
  }
  return out.join('');
}

function escapeText(s: string): string {
  return s
    .replace(/\\/g, '\\\\')
    .replace(/;/g, '\\;')
    .replace(/,/g, '\\,')
    .replace(/\r?\n/g, '\\n');
}

const VTIMEZONE = [
  'BEGIN:VTIMEZONE',
  `TZID:${TZID}`,
  'BEGIN:STANDARD',
  'DTSTART:19700101T000000',
  'TZOFFSETFROM:+0800',
  'TZOFFSETTO:+0800',
  'TZNAME:GMT+8',
  'END:STANDARD',
  'END:VTIMEZONE'
];

const RRULE_DAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;

/** All dates in the block falling on one of the course's teaching weekdays. */
export function blockDates(course: Course): DateParts[] {
  const out: DateParts[] = [];
  const allowed = new Set(course.days);
  for (
    let d = parseDate(course.startDate);
    compareDate(d, parseDate(course.endDate)) <= 0;
    d = addDays(d, 1)
  ) {
    if (allowed.has(dayOfWeek(d))) out.push(d);
  }
  return out;
}

/** Concrete teaching dates: `blockDates` minus public holidays. */
export function teachingDates(course: Course): DateParts[] {
  const offDates = new Set(holidays.map((h) => h.date));
  return blockDates(course).filter((d) => !offDates.has(toIsoDate(d)));
}

/**
 * Builds a complete VCALENDAR for the selected courses. One VEVENT per course
 * with a weekly RRULE over the course's teaching days, plus EXDATEs for
 * holidays — so importing yields one manageable series per course in
 * Asia/Shanghai local time.
 */
export function buildIcs(selected: Course[], calendarName = 'NUSRI ECE AY26/27'): string {
  const now = new Date();
  const stamp = `${now.getUTCFullYear()}${pad(now.getUTCMonth() + 1)}${pad(now.getUTCDate())}T${pad(
    now.getUTCHours()
  )}${pad(now.getUTCMinutes())}${pad(now.getUTCSeconds())}Z`;

  const lines: string[] = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//NUSRI ECE//Course Schedule AY26/27//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
    `X-WR-CALNAME:${escapeText(calendarName)}`,
    `X-WR-TIMEZONE:${TZID}`,
    ...VTIMEZONE
  ];

  for (const course of selected) {
    const st = parseTime(course.startTime);
    const et = parseTime(course.endTime);
    const sessions = teachingDates(course);
    if (sessions.length === 0) continue;

    // RRULE expands from the first actual session; holidays become EXDATEs
    // (they must match the occurrence start time exactly).
    const first = sessions[0];
    const byday = course.days.map((d) => RRULE_DAYS[d]).join(',');
    const until = localToUtcStamp(parseDate(course.endDate), { hh: 23, mm: 59, ss: 59 });
    const offDates = new Set(holidays.map((h) => h.date));
    const exdates = blockDates(course).filter((d) => offDates.has(toIsoDate(d)));

    lines.push(
      'BEGIN:VEVENT',
      `UID:${course.code.toLowerCase()}-${course.startDate.replaceAll('-', '')}@nusri-ece-ics`,
      `DTSTAMP:${stamp}`,
      `DTSTART;TZID=${TZID}:${formatIcsLocal(first, st)}`,
      `DTEND;TZID=${TZID}:${formatIcsLocal(first, et)}`,
      `RRULE:FREQ=WEEKLY;BYDAY=${byday};UNTIL=${until}`
    );
    if (exdates.length > 0) {
      lines.push(`EXDATE;TZID=${TZID}:${exdates.map((d) => formatIcsLocal(d, st)).join(',')}`);
    }
    lines.push(
      `SUMMARY:${escapeText(`${course.code} ${course.title}`)}`,
      `LOCATION:${escapeText(course.room ? `Room ${course.room}, National University of Singapore Suzhou Research Institute` : 'National University of Singapore Suzhou Research Institute')}`,
      `DESCRIPTION:${escapeText(
        [
          `${course.title} (${course.code}) — NUSRI Suzhou · AY 2026/27`,
          `Block ${course.startDate} to ${course.endDate} (${course.days
            .map((d) => RRULE_DAYS[d])
            .join(', ')})`,
          `Weekly ${course.startTime}–${course.endTime} in Room ${course.room}`
        ].join('\n')
      )}`,
      'END:VEVENT'
    );
  }

  lines.push('END:VCALENDAR');
  return `${lines.map(foldLine).join('\r\n')}\r\n`;
}
