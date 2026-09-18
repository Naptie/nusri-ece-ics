# NUSRI ECE AY26/27 Schedule → Calendar (.ics)

A SvelteKit site that lets ECE students at NUSRI (Suzhou) pick the courses they're taking in
AY 2026/27 and export a ready-to-import **.ics** calendar — or subscribe with one tap.

## Features

- Course cards with block dates, times, rooms, and teaching-day badges
- Live conflict detection between selected courses
- **Subscribe** (`webcal://`) — opens the platform's calendar-subscription flow with a URL that
  encodes your selection (`/calendar/ees4205+ees4500.ics`). Enabled once at least one course is
  selected. Handled natively by Apple Calendar (iOS/macOS); elsewhere it depends on an installed
  calendar app that registers the scheme (Outlook on Windows, GNOME Calendar on Linux, various
  Android apps). Calendar apps re-fetch the URL on their own schedule, so schedule fixes propagate
  automatically. Re-subscribe after changing your selection.
- **Download .ics** — selection-based file export, works everywhere
- **Google Calendar links** — prefilled weekly series per course (`recur=RRULE`), one tap + Save
- Mobile-friendly, sticky export bar, dark mode support

ICS files use one `VEVENT` per course with a weekly `RRULE` over the course's teaching days and
`EXDATE` entries for holidays — compact and easy to manage inside calendar apps.

## Import flows per platform

| Platform | One-shot import | Subscribe |
| --- | --- | --- |
| iPhone/iPad | Download → tap in Safari's Downloads → "Add All to Calendar" | `webcal://` → Calendar subscribe sheet (native) |
| Android | Download → open (calendar app picks up the file) | `webcal://` (needs an app that registers the scheme) |
| **Windows + Outlook** | Double-click the `.ics` → Outlook opens each series (`Outlook.EXE /ical`) | `webcal://` → `Outlook.EXE /share` → "Add Internet Calendar Subscription" |
| **macOS** | Open the file → Calendar import | `webcal://` → Calendar.app subscription (native) |
| Google Calendar (any device) | Per-course chips → prefilled `recur=RRULE` event → Save | — |

No platform's share sheet accepts `.ics` files as a calendar-import target (iOS rejects the file
type outright; Windows Chromium advertises `canShare` but rejects the share with
`NotAllowedError`), so there is no Share button — Subscribe and Download cover the flows.

`webcal://` is not an IETF standard scheme: Apple integrates it at the OS level (iOS/macOS), and
other platforms only handle it if a calendar app registered the handler. There is no browser API
to query custom-scheme handlers, so the link is always served unconditionally; platforms without
a handler surface their own "no app found" dialog.

Outlook Web compose deep links are intentionally **not** offered: the parameter set (verified
against `add-event-to-calendar-docs`) has no recurrence support, so a 2–3 week course block would
need a separate link per session. The downloaded `.ics` carries the whole series correctly.

## Tech stack

- [SvelteKit](https://svelte.dev/docs/kit) + TypeScript — prerendered page + SSR endpoint,
  deployed to [Cloudflare Workers](https://developers.cloudflare.com/workers/)
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn-svelte](https://shadcn-svelte.com) (vega preset)
- [Biome](https://biomejs.dev) for lint + format
- [Bun](https://bun.sh) for runtime, tests, and package management
- [Wrangler](https://developers.cloudflare.com/workers/wrangler/) for local preview + deploy

## Development

```sh
bun install
bun run dev -- --open
```

Tests, typecheck, and lint:

```sh
bun test
bun run check
bun run lint
```

Production build (outputs to `.svelte-kit/cloudflare`) and local preview through the Worker
runtime:

```sh
bun run build
bun run preview
```

## Deployment

The main page is prerendered to an edge-cached asset; the dynamic `/calendar/[codes].ics`
endpoint runs on the Worker:

```sh
bun run deploy
```

Selection calendars live at `/calendar/<codes>.ics` (codes sorted, `+`-separated, lowercase).
There is intentionally no whole-program calendar: every module here is an elective, so
subscriptions always target a selection.

Note: Cloudflare's default build image ships an older Bun that cannot parse newer `bun.lock`
versions. Pin the Worker's build variable `BUN_VERSION` (e.g. `1.4.2`) under
**Settings → Build → Build Variables and Secrets** so `bun install --frozen-lockfile` succeeds.

## Data

Course data lives in `src/lib/courses.ts`. Each entry:

```ts
{
  code: 'EES4205',
  title: 'Silicon Power Devices and Circuits',
  startDate: '2026-10-19',
  endDate: '2026-11-06',
  startTime: '14:00',
  endTime: '17:00',
  room: '318',
  days: [0, 1, 2, 3, 4], // teaching weekdays, 0 = Mon … 6 = Sun
}
```

Day-off patterns follow the academic calendar: most blocks are Mon–Fri ("Sat, Sun off");
EES4400 and EES4408 include Saturdays ("Sun off"). Sessions are emitted as recurring events
in `Asia/Shanghai` with a `VTIMEZONE` block, so imports land on the correct local time.

Chinese public holidays inside teaching blocks are encoded in the `holidays` array and become
`EXDATE` entries: Qingming Festival, Sat 3 – Mon 5 Apr 2027 (expected Sat–Mon break, no makeup
workday; the State Council's official 2027 arrangement is due Nov 2026 — update `holidays`
then and re-deploy; subscribers pick it up automatically).
