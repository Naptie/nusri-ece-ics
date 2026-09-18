import { calendarPathFor, courses } from '$lib/courses';
import { buildIcs } from '$lib/ics';
import type { RequestHandler } from './$types';

// Runs dynamically in the Cloudflare Worker so any course selection can be
// addressed by URL: /calendar/ees4205+ees4500.ics — the URL itself is the
// persistence; calendar apps keep fetching it verbatim.
export const prerender = false;

export const GET: RequestHandler = ({ params }) => {
  const codes = params.codes.replace(/\.ics$/, '').split('+');
  const normalized = calendarPathFor(codes);
  if (!normalized) return new Response('Not found', { status: 404 });

  const selected = courses.filter((c) => normalized.split('+').includes(c.code.toLowerCase()));
  const ics = buildIcs(selected, `NUSRI ECE AY26/27 (${selected.length} courses)`);

  return new Response(ics, {
    headers: {
      'Content-Type': 'text/calendar; charset=utf-8',
      'Content-Disposition': `inline; filename="nusri-ece-ay2627-${normalized}.ics"`,
      'Cache-Control': 'public, max-age=3600'
    }
  });
};
