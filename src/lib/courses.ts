/**
 * NUSRI (Suzhou) ECE course schedule — Academic Year 2026/27.
 * Data transcribed from the official ECE module timetable / academic calendar.
 * Day-off patterns follow the calendar: "(Sat, Sun off)" = Mon–Fri,
 * "(Sun off)" = Mon–Sat. EES4400 follows the manager's latest timetable
 * (29 Mar – 10 Apr 2027), whose Saturday end date implies Mon–Sat.
 */

export const TZID = 'Asia/Shanghai';

/** 0 = Monday … 6 = Sunday. */
export type DayCode = 0 | 1 | 2 | 3 | 4 | 5 | 6;

export const DAY_LABELS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'] as const;

export type Course = {
  code: string;
  title: string;
  /** Inclusive ISO date range of the teaching block, local to Asia/Shanghai. */
  startDate: string;
  endDate: string;
  /** Local clock times, 24h. */
  startTime: string;
  endTime: string;
  room: string;
  /** Teaching days within the block (0 = Mon … 6 = Sun). */
  days: DayCode[];
};

const MON_FRI: DayCode[] = [0, 1, 2, 3, 4];
const MON_SAT: DayCode[] = [0, 1, 2, 3, 4, 5];

export type Holiday = {
  /** ISO date (YYYY-MM-DD). */
  date: string;
  name: string;
};

/**
 * Chinese public holidays falling inside teaching blocks.
 *
 * The 2027 official arrangement (国务院办公厅) is expected in Nov 2026;
 * Qingming 2027 falls on Monday 5 Apr, so a Sat–Mon break (3–5 Apr) is the
 * expected pattern — encoded provisionally until confirmed.
 */
export const holidays: Holiday[] = [
  { date: '2027-04-03', name: 'Qingming Festival (observed)' },
  { date: '2027-04-04', name: 'Qingming Festival (observed)' },
  { date: '2027-04-05', name: 'Qingming Festival' }
];

export const courses: Course[] = [
  {
    code: 'EES4205',
    title: 'Silicon Power Devices and Circuits',
    startDate: '2026-10-19',
    endDate: '2026-11-06',
    startTime: '14:00',
    endTime: '17:00',
    room: '318',
    days: MON_FRI
  },
  {
    code: 'EES4402',
    title: 'Radio Frequency Design and Systems',
    startDate: '2026-12-07',
    endDate: '2026-12-25',
    startTime: '09:00',
    endTime: '12:00',
    room: '201',
    days: MON_FRI
  },
  {
    code: 'EES4725',
    title: 'Digital Circuits and FPGA Design',
    startDate: '2026-12-07',
    endDate: '2026-12-25',
    startTime: '14:00',
    endTime: '17:00',
    room: '322',
    days: MON_FRI
  },
  {
    code: 'EES4404',
    title: 'Renewable Generation and Smart Grid',
    startDate: '2026-12-07',
    endDate: '2026-12-25',
    startTime: '18:00',
    endTime: '21:00',
    room: '206/207',
    days: MON_FRI
  },
  {
    code: 'EES4502',
    title: 'Semiconductor Fabrication Process Technology',
    startDate: '2027-02-22',
    endDate: '2027-03-12',
    startTime: '14:00',
    endTime: '17:00',
    room: '317',
    days: MON_FRI
  },
  {
    code: 'EES4500',
    title: 'Semiconductor Optoelectronics',
    startDate: '2027-03-16',
    endDate: '2027-04-05',
    startTime: '14:00',
    endTime: '17:00',
    room: '318',
    days: MON_FRI
  },
  {
    code: 'EES4408',
    title: 'Machine Learning: Models and Applications',
    startDate: '2027-03-17',
    endDate: '2027-03-31',
    startTime: '09:00',
    endTime: '12:00',
    room: '206/207',
    days: MON_SAT
  },
  {
    code: 'EES4400',
    title: 'Microwave Communications',
    startDate: '2027-03-29',
    endDate: '2027-04-10',
    startTime: '14:00',
    endTime: '17:00',
    room: '210',
    days: MON_SAT
  },
  {
    code: 'EES4508',
    title: 'Semiconductor Measurement and Characterization',
    startDate: '2027-04-05',
    endDate: '2027-04-23',
    startTime: '09:00',
    endTime: '12:00',
    room: '325',
    days: MON_FRI
  }
];
