import { courses } from '$lib/courses';
import { buildIcs } from '$lib/ics';
import type { RequestHandler } from './$types';

// Prerendered to a static /calendar.ics at build time (adapter-static), so
// `webcal://<host>/calendar.ics` gives iPhone users a one-tap subscription.
export const prerender = true;

export const GET: RequestHandler = () =>
  new Response(buildIcs(courses), {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': 'inline; filename="nusri-ece-ay2627.ics"'
    }
  });
