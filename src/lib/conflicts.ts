import type { Course } from './courses.ts';
import { compareDate, parseDate, parseTime, toIsoDate } from './ics.ts';

export type Conflict = {
  a: Course;
  b: Course;
  /** First date (ISO) on which the two sessions overlap. */
  from: string;
  /** Last date (ISO) of the overlap window. */
  to: string;
};

function overlaps(a: { hh: number; mm: number }, b: { hh: number; mm: number }): boolean {
  return a.hh * 60 + a.mm < b.hh * 60 + b.mm;
}

/** Finds pairwise time conflicts between selected courses (weekdays only). */
export function findConflicts(selected: Course[]): Conflict[] {
  const out: Conflict[] = [];
  for (let i = 0; i < selected.length; i++) {
    for (let j = i + 1; j < selected.length; j++) {
      const a = selected[i];
      const b = selected[j];
      const as = parseDate(a.startDate);
      const bs = parseDate(b.startDate);
      const ae = parseDate(a.endDate);
      const be = parseDate(b.endDate);

      const from = compareDate(as, bs) >= 0 ? as : bs;
      const to = compareDate(ae, be) <= 0 ? ae : be;
      if (compareDate(from, to) > 0) continue;

      const aS = parseTime(a.startTime);
      const aE = parseTime(a.endTime);
      const bS = parseTime(b.startTime);
      const bE = parseTime(b.endTime);

      // Intervals overlap iff aStart < bEnd && bStart < aEnd
      if (overlaps(aS, bE) && overlaps(bS, aE)) {
        out.push({ a, b, from: toIsoDate(from), to: toIsoDate(to) });
      }
    }
  }
  return out;
}
