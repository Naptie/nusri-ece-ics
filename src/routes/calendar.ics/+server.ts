import { courses } from '$lib/courses';
import { buildIcs } from '$lib/ics';
import type { RequestHandler } from './$types';

// Full schedule (all courses), prerendered to a static /calendar.ics at build
// time and served from the edge — the default subscription when no selection
// is made. Selection-aware subscriptions live at /calendar/[codes].ics.
export const prerender = true;

export const GET: RequestHandler = () =>
  new Response(buildIcs(courses), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="nusri-ece-ay2627.ics"'
    }
  });
