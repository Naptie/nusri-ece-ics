<script lang="ts">
  import { Download, Rss } from '@lucide/svelte';
  import { onMount } from 'svelte';
  import { toast } from 'svelte-sonner';
  import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { findConflicts } from '$lib/conflicts';
  import { calendarPathFor, courses, DAY_LABELS } from '$lib/courses';
  import { gcalTemplateUrl } from '$lib/gcal';
  import { buildIcs } from '$lib/ics';
  import { isApple, isAppleMobile, isWindows } from '$lib/platform';
  import { cn } from '$lib/utils';

  let selected = $state<string[]>([]);
  let appleMobile = $state(false);
  let origin = $state('');

  onMount(() => {
    appleMobile = isAppleMobile();
    origin = window.location.origin;
  });

  const selectedCourses = $derived(
    courses
      .filter((c) => selected.includes(c.code))
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
  );
  const conflicts = $derived(findConflicts(selectedCourses));
  const conflictCodes = $derived(new Set(conflicts.flatMap((c) => [c.a.code, c.b.code])));

  const canExport = $derived(selected.length > 0);

  // Subscription URL encodes the current selection; empty selection subscribes
  // to the full schedule. The URL itself is the persistence — the calendar app
  // keeps re-fetching it, no per-user state involved.
  //
  // webcal:// is served unconditionally: it is handled natively by Apple
  // Calendar (iOS/macOS) and by Outlook/GNOME Calendar wherever those are
  // installed. There is no browser API to query custom-scheme handlers, so
  // platforms without a handler will surface their own "no app found" dialog.
  const subscribeHref = $derived.by(() => {
    if (!origin) return '/calendar.ics';
    const host = origin.replace(/^https?:\/\//, '');
    const path = selected.length > 0 ? calendarPathFor(selected) : null;
    const target = path ? `/calendar/${path}.ics` : '/calendar.ics';
    return `webcal://${host}${target}`;
  });

  function downloadHint(): string {
    if (appleMobile) {
      return 'Tap the ↓ (Downloads) icon in Safari, then tap the file — iOS offers "Add All to Calendar".';
    }
    if (isWindows()) {
      return 'Double-click the file — Outlook opens each course as a recurring series for you to save.';
    }
    if (isApple()) {
      return 'Open the file — Calendar offers to add all events.';
    }
    return 'Open the file to import all sessions into your calendar app.';
  }

  function toggle(code: string, checked: boolean) {
    selected = checked ? [...selected, code] : selected.filter((c) => c !== code);
  }

  function icsFileName() {
    const n = selectedCourses.length;
    return `nusri-ece-ay2627-${n}-course${n === 1 ? '' : 's'}.ics`;
  }

  function icsHref(): string {
    const blob = new Blob([buildIcs(selectedCourses)], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    setTimeout(() => URL.revokeObjectURL(url), 10_000);
    return url;
  }

  function download() {
    const a = document.createElement('a');
    a.href = icsHref();
    a.download = icsFileName();
    document.body.append(a);
    a.click();
    a.remove();
    toast.success('Calendar file downloaded', { description: downloadHint() });
  }
</script>

<main class="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
  <header class="flex flex-col gap-2 text-center sm:items-center">
    <Badge variant="secondary" class="w-fit">NUSRI Suzhou · ECE · AY 2026/27</Badge>
    <h1 class="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
      Build your course calendar
    </h1>
    <p class="text-muted-foreground max-w-prose text-pretty sm:text-lg">
      Tick the courses you're taking, then export a ready-to-import calendar file — or subscribe in
      one tap. Sessions follow each course's day pattern and skip Chinese public holidays.
    </p>
  </header>

  <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3" aria-label="Course selection">
    {#each courses as course (course.code)}
      {@const isChecked = selected.includes(course.code)}
      {@const conflicted = conflictCodes.has(course.code)}
      <Card.Root
        class={cn(
    'gap-4 py-4 transition-all',
    isChecked && 'ring-2 ring-primary',
    conflicted && 'border-destructive/60'
  )}
      >
        <Card.Content class="flex h-full flex-col gap-3 px-4">
          <div class="flex items-start justify-between gap-2">
            <label for={`course-${course.code}`} class="flex flex-1 cursor-pointer flex-col gap-1">
              <span class="flex items-center gap-2 font-mono text-sm font-semibold">
                <Checkbox
                  id={`course-${course.code}`}
                  checked={isChecked}
                  onCheckedChange={(v) => toggle(course.code, v === true)}
                  aria-label={`Select ${course.code}`}
                />
                {course.code}
              </span>
              <span class="text-sm leading-snug font-medium">{course.title}</span>
            </label>
          </div>
          <div class="mt-auto flex flex-wrap gap-1.5">
            <Badge variant="outline" class="font-mono text-[11px]">
              {course.startDate.slice(5)}
              → {course.endDate.slice(5)}
            </Badge>
            <Badge variant="outline" class="font-mono text-[11px]">{course.startTime}</Badge>
            <Badge variant="outline" class="font-mono text-[11px]">Rm {course.room}</Badge>
            <Badge variant="outline" class="font-mono text-[11px]">
              {course.days.map((d) => DAY_LABELS[d].slice(0, 2)).join('·')}
            </Badge>
          </div>
          {#if conflicted}
            <p class="text-destructive text-xs font-medium">Overlaps another selected course</p>
          {/if}
        </Card.Content>
      </Card.Root>
    {/each}
  </section>

  <p class="text-muted-foreground text-xs">
    Sessions follow each course's day pattern (most are Mon–Fri; EES4400 and EES4408 also include
    Saturdays). Chinese public holidays inside teaching blocks are skipped: Qingming Festival, Sat 3
    – Mon 5 Apr 2027 (expected Sat–Mon break, no makeup workday; official arrangement due Nov 2026).
  </p>

  {#if conflicts.length > 0}
    <Alert variant="destructive">
      <svg
        aria-hidden="true"
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        stroke-width="2"
        stroke-linecap="round"
        stroke-linejoin="round"
      >
        <path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 20h16a2 2 0 0 0 1.73-2Z" />
        <path d="M12 9v4" />
        <path d="M12 17h.01" />
      </svg>
      <AlertTitle>Schedule conflict detected</AlertTitle>
      <AlertDescription>
        {#each conflicts as conflict (conflict.a.code + conflict.b.code)}
          <p>
            {conflict.a.code}
            overlaps {conflict.b.code}
            between {conflict.from} and {conflict.to}.
          </p>
        {/each}
      </AlertDescription>
    </Alert>
  {/if}

  <section
    class="bg-background/80 sticky bottom-0 -mx-4 border-t px-4 py-3 backdrop-blur sm:-mx-6 sm:px-6"
    aria-label="Export"
  >
    <div class="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
      <p class="text-muted-foreground text-sm">
        {#if selected.length === 0}
          Select at least one course to export
        {:else}
          {selected.length}
          course{selected.length === 1 ? '' : 's'}
          selected
        {/if}
      </p>
      <div class="flex gap-2 max-sm:grid max-sm:grid-cols-2">
        <Button variant="outline" onclick={download} disabled={!canExport}>
          <Download />
          Download .ics
        </Button>
        <Button
          href={subscribeHref}
          title="Opens a webcal:// subscription. Handled natively by Apple Calendar (iOS/macOS); elsewhere it depends on an installed calendar app (Outlook, GNOME Calendar, etc.) registering the scheme. The URL follows your selection — re-subscribe after changing courses."
        >
          <Rss />
          Subscribe
        </Button>
      </div>
    </div>
    {#if selectedCourses.length > 0}
      <div class="mt-2 flex flex-wrap items-center gap-1.5">
        <span class="text-muted-foreground text-xs">Add to Google Calendar:</span>
        {#each selectedCourses as course (course.code)}
          <a
            class="border-input bg-background hover:bg-muted rounded-md border px-2 py-1 font-mono text-[11px] transition-colors"
            href={gcalTemplateUrl(course)}
            target="_blank"
            rel="noopener"
            title="Prefilled weekly series — tap Save. Note: Google's URL can't skip the Qingming holiday days; the .ics file does."
          >
            {course.code}
          </a>
        {/each}
      </div>
    {/if}
  </section>
</main>
