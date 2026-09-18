# NUSRI ECE AY26/27 Schedule → Calendar (.ics)

A static SvelteKit site that lets ECE students at NUSRI (Suzhou) pick the courses
they're taking in AY 2026/27 and export a ready-to-import **.ics** calendar file.

## Features

- Course cards with block dates, time, and room badges
- Live conflict detection between selected courses
- One-shot **Share / Add to calendar** via the Web Share API (falls back to download)
- Direct **Download .ics** button
- Mobile-friendly, sticky export bar, dark mode support

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
