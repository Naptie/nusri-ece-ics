import type { Course } from './courses.ts';
import { formatIcsLocal, localToUtcStamp, parseDate, parseTime, teachingDates } from './ics.ts';

const RRULE_DAYS = ['MO', 'TU', 'WE', 'TH', 'FR', 'SA', 'SU'] as const;

/**
 * Google Calendar "add event" template URL with the course's weekly recurrence
 * prefilled. One tap opens a prefilled event page whose "Save" imports the
 * whole block into the user's Google account (synced to their phone).
 *
 * The URL scheme cannot express holiday exclusions (no EXDATE), so the
 * Qingming days in April are included here, unlike the generated .ics file.
 */
export function gcalTemplateUrl(course: Course): string {
  const dates = teachingDates(course);
  const first = dates[0];
  const st = parseTime(course.startTime);
  const et = parseTime(course.endTime);
  const rruleDays = course.days.map((d) => RRULE_DAYS[d]).join(',');
  const until = localToUtcStamp(parseDate(course.endDate), { hh: 23, mm: 59, ss: 59 });
  const params = new URLSearchParams({
    action: 'TEMPLATE',
    text: `${course.code} ${course.title}`,
    dates: `${formatIcsLocal(first, st)}/${formatIcsLocal(first, et)}`,
    recur: `RRULE:FREQ=WEEKLY;BYDAY=${rruleDays};UNTIL=${until}`,
    location: `Room ${course.room}`,
    details: `${course.title} (${course.code}) — NUSRI Suzhou · AY 2026/27 · block ${course.startDate} → ${course.endDate} · ${course.startTime}–${course.endTime}`,
    ctz: 'Asia/Shanghai'
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}
