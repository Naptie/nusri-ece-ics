# NUSRI ECE AY26/27 Schedule → Calendar (.ics)

A static SvelteKit site that lets ECE students at NUSRI (Suzhou) pick the courses
they're taking in AY 2026/27 and export a ready-to-import **.ics** calendar file.

## Features

- Course cards with block dates, times, rooms, and teaching-day badges
- Live conflict detection between selected courses
- **Subscribe** (`webcal://`) — one-tap calendar subscription on iPhone/macOS. The subscription
  URL encodes your selection (`/calendar/ees4205+ees4500.ics`); calendar apps re-fetch it on their
  own schedule, so schedule fixes propagate automatically. Re-subscribe after changing your
  selection.
- **Download .ics** — selection-based file export, works everywhere
- **Google Calendar links** — prefilled weekly series per course (`recur=RRULE`), one tap + Save
- Share button where the platform supports it (Android/desktop Chromium; iOS share sheet has no
  Calendar target, so it's hidden there)
- Mobile-friendly, sticky export bar, dark mode support

ICS files use one `VEVENT` per course with a weekly `RRULE` over the course's teaching days and
`EXDATE` entries for holidays — compact and easy to manage inside calendar apps.

## Import flows per platform

| Platform | One-shot import | Subscribe |
| --- | --- | --- |
| iPhone/iPad | Download → tap in Safari's Downloads → "Add All to Calendar" | `webcal://` → Calendar subscribe sheet |
| Android | Download → open (calendar app picks up the file) | https download |
| **Windows + Outlook** | Double-click the `.ics` → Outlook opens each series (`Outlook.EXE /ical`) | `webcal://` → `Outlook.EXE /share` → "Add Internet Calendar Subscription" |
| **macOS** | Open the file → Calendar import | `webcal://` → Calendar.app subscription |
| Google Calendar (any device) | Per-course chips → prefilled `recur=RRULE` event → Save | — |

Outlook Web compose deep links are intentionally **not** offered: the parameter set (verified
against `add-event-to-calendar-docs`) has no recurrence support, so a 2–3 week course block would
need a separate link per session. The downloaded `.ics` carries the whole series correctly.

## Tech stack

- [SvelteKit](https://svelte.dev/docs/kit) (static adapter, prerendered) + TypeScript
- [Tailwind CSS v4](https://tailwindcss.com) + [shadcn-svelte](https://shadcn-svelte.com) (vega preset)
- [Biome](https://biomejs.dev) for lint + format
- [Bun](https://bun.sh) for runtime, tests, and package management

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

Production build (outputs to `build/`):

```sh
bun run build
bun run preview
```

## Deployment

Runs on Cloudflare Workers (SSR for the dynamic `/calendar/[codes].ics` endpoint, with the main
page and `/calendar.ics` prerendered to edge-cached assets):

```sh
bun run deploy
```

The full schedule lives at `/calendar.ics`; any selection at
`/calendar/<codes>.ics` (codes sorted, `+`-separated, lowercase).

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
}
```

Sessions are emitted as weekday (MO–FR) recurring events in `Asia/Shanghai`
with a VTIMEZONE block, so imports land on the correct local time.
