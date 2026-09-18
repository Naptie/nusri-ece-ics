import { describe, expect, test } from 'bun:test';
import { findConflicts } from './conflicts.ts';
import type { Course } from './courses.ts';
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
    // 29 Mar – 10 Apr 2027 = 2 weeks: Mon–Sat ×2 = 12 sessions
    expect(dates).toHaveLength(12);
    const last = dates[dates.length - 1];
    expect(last).toEqual({ y: 2027, m: 4, d: 10 });
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

  test('emits one concrete VEVENT per teaching day', () => {
    expect(ics).toContain('DTSTART;TZID=Asia/Shanghai:20261019T140000');
    expect(ics).toContain('DTEND;TZID=Asia/Shanghai:20261019T170000');
    // Friday of first week
    expect(ics).toContain('DTSTART;TZID=Asia/Shanghai:20261023T140000');
    // Last Friday of the block
    expect(ics).toContain('DTSTART;TZID=Asia/Shanghai:20261106T140000');
    // No recurrence rule; no weekend sessions
    expect(ics).not.toContain('RRULE');
    expect(ics).not.toContain('20261024T');
    expect(ics).not.toContain('20261025T');
    expect(ics).toContain('SUMMARY:EES4205 Silicon Power Devices and Circuits');
    expect(ics).toContain('LOCATION:Room 318');
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
