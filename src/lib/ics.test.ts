import { describe, expect, test } from 'bun:test';
import { findConflicts } from './conflicts.ts';
import { type Course, calendarPathFor } from './courses.ts';
import { gcalTemplateUrl } from './gcal.ts';
import { buildIcs, dayOfWeek, formatIcsLocal, teachingDates } from './ics.ts';

const EES4205: Course = {
  code: 'EES4205',
  title: 'Silicon Power Devices and Circuits',
  startDate: '2026-10-19',
  endDate: '2026-11-06',
  startTime: '14:00',
  endTime: '17:00',
  room: '318',
  days: [0, 1, 2, 3, 4]
};

const EES4400: Course = {
  code: 'EES4400',
  title: 'Microwave Communications',
  startDate: '2027-03-29',
  endDate: '2027-04-10',
  startTime: '14:00',
  endTime: '17:00',
  room: '210',
  days: [0, 1, 2, 3, 4, 5]
};

describe('dayOfWeek', () => {
  test('2026-10-19 is a Monday', () => {
    expect(dayOfWeek({ y: 2026, m: 10, d: 19 })).toBe(0);
  });

  test('2027-04-10 is a Saturday', () => {
    expect(dayOfWeek({ y: 2027, m: 4, d: 10 })).toBe(5);
  });
});

describe('teachingDates', () => {
  test('expands Mon–Fri blocks, skipping weekends', () => {
    const dates = teachingDates({
      ...EES4205,
      startDate: '2026-10-19',
      endDate: '2026-10-25'
    });
    // Mon 19 – Fri 23 = 5 sessions; weekend skipped
    expect(dates).toHaveLength(5);
    expect(dates[0]).toEqual({ y: 2026, m: 10, d: 19 });
    expect(dates[4]).toEqual({ y: 2026, m: 10, d: 23 });
  });

  test('includes Saturdays for Mon–Sat courses', () => {
    const dates = teachingDates(EES4400);
    // 29 Mar – 10 Apr 2027: Mon–Sat ×2 = 12 minus Qingming (Sat 3 + Mon 5 Apr) = 10
    expect(dates).toHaveLength(10);
    const last = dates[dates.length - 1];
    expect(last).toEqual({ y: 2027, m: 4, d: 10 });
  });

  test('excludes Qingming Festival 2027 (3–5 Apr)', () => {
    // Mon–Sat block spanning Qingming: Sat 3 Apr and Mon 5 Apr are holidays
    const dates = teachingDates({
      ...EES4400,
      startDate: '2027-03-31',
      endDate: '2027-04-06'
    });
    // Wed 31, Thu 1, Fri 2, Tue 6 — Sat 3 + Mon 5 skipped as holidays
    expect(dates).toHaveLength(4);
    expect(dates.map((d) => `${d.m}-${d.d}`)).toEqual(['3-31', '4-1', '4-2', '4-6']);
  });
});

describe('formatIcsLocal', () => {
  test('pads all components', () => {
    expect(formatIcsLocal({ y: 2026, m: 10, d: 19 }, { hh: 14, mm: 0 })).toBe('20261019T140000');
    expect(formatIcsLocal({ y: 2027, m: 1, d: 5 }, { hh: 9, mm: 0 })).toBe('20270105T090000');
  });
});

describe('buildIcs', () => {
  const ics = buildIcs([EES4205]);

  test('has calendar skeleton', () => {
    expect(ics).toContain('BEGIN:VCALENDAR');
    expect(ics).toContain('VERSION:2.0');
    expect(ics).toContain('BEGIN:VTIMEZONE');
    expect(ics).toContain('TZID:Asia/Shanghai');
    expect(ics).toContain('X-WR-TIMEZONE:Asia/Shanghai');
    expect(ics).toContain('END:VCALENDAR');
  });

  test('emits one weekly series per course', () => {
    expect((ics.match(/BEGIN:VEVENT/g) ?? []).length).toBe(1);
    expect(ics).toContain('DTSTART;TZID=Asia/Shanghai:20261019T140000');
    expect(ics).toContain('DTEND;TZID=Asia/Shanghai:20261019T170000');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;UNTIL=20261106T155959Z');
    // No holidays in this block → no EXDATE
    expect(ics).not.toContain('EXDATE');
    expect(ics).toContain('SUMMARY:EES4205 Silicon Power Devices and Circuits');
    expect(ics).toContain('LOCATION:Room 318');
  });

  test('excludes Qingming sessions via EXDATE', () => {
    const ics = buildIcs([EES4400]);
    expect(ics).toContain('DTSTART;TZID=Asia/Shanghai:20270329T140000');
    expect(ics).toContain('RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA;UNTIL=20270410T155959Z');
    // Sat 3 + Mon 5 Apr sessions skipped as holidays
    expect(ics).toContain('EXDATE;TZID=Asia/Shanghai:20270403T140000,20270405T140000');
  });

  test('uses CRLF line endings and trailing CRLF', () => {
    expect(ics.endsWith('\r\n')).toBe(true);
    expect(ics.replaceAll('\r\n', '\n')).not.toContain('\n\n');
  });
});

describe('findConflicts', () => {
  const EES4408: Course = {
    code: 'EES4408',
    title: 'Machine Learning: Models and Applications',
    startDate: '2027-03-17',
    endDate: '2027-03-31',
    startTime: '09:00',
    endTime: '12:00',
    room: '206/207',
    days: [0, 1, 2, 3, 4, 5]
  };
  const EES4500: Course = {
    code: 'EES4500',
    title: 'Semiconductor Optoelectronics',
    startDate: '2027-03-16',
    endDate: '2027-04-05',
    startTime: '14:00',
    endTime: '17:00',
    room: '318',
    days: [0, 1, 2, 3, 4]
  };

  test('detects date + time overlap', () => {
    const conflicts = findConflicts([EES4500, EES4400]);
    expect(conflicts).toHaveLength(1);
    expect(conflicts[0].a.code).toBe('EES4500');
    expect(conflicts[0].b.code).toBe('EES4400');
    expect(conflicts[0].from).toBe('2027-03-29');
    expect(conflicts[0].to).toBe('2027-04-05');
  });

  test('no conflict when times are disjoint on same dates', () => {
    expect(findConflicts([EES4500, EES4408])).toHaveLength(0);
  });

  test('no conflict on adjacent blocks', () => {
    expect(findConflicts([EES4205, EES4408])).toHaveLength(0);
  });
});

describe('gcalTemplateUrl', () => {
  test('encodes recurrence and timezone for a Mon–Fri course', () => {
    const url = new URL(gcalTemplateUrl(EES4205));
    expect(url.origin + url.pathname).toBe('https://calendar.google.com/calendar/render');
    expect(url.searchParams.get('action')).toBe('TEMPLATE');
    expect(url.searchParams.get('text')).toBe('EES4205 Silicon Power Devices and Circuits');
    expect(url.searchParams.get('dates')).toBe('20261019T140000/20261019T170000');
    expect(url.searchParams.get('recur')).toBe(
      'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR;UNTIL=20261106T155959Z'
    );
    expect(url.searchParams.get('ctz')).toBe('Asia/Shanghai');
    expect(url.searchParams.get('location')).toBe('Room 318');
  });

  test('includes Saturdays for Mon–Sat courses', () => {
    const url = new URL(gcalTemplateUrl(EES4400));
    expect(url.searchParams.get('recur')).toBe(
      'RRULE:FREQ=WEEKLY;BYDAY=MO,TU,WE,TH,FR,SA;UNTIL=20270410T155959Z'
    );
    expect(url.searchParams.get('dates')).toBe('20270329T140000/20270329T170000');
  });
});

describe('calendarPathFor', () => {
  test('normalizes, dedupes, and sorts codes', () => {
    expect(calendarPathFor(['ees4500', 'EES4205', 'ees4205'])).toBe('ees4205+ees4500');
  });

  test('rejects unknown codes and empty selections', () => {
    expect(calendarPathFor([])).toBeNull();
    expect(calendarPathFor(['EES9999'])).toBeNull();
  });
});
