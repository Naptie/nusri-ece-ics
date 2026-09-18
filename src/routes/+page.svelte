<script lang="ts">
  import { Download, Share2 } from '@lucide/svelte';
  import { toast } from 'svelte-sonner';
  import { Alert, AlertDescription, AlertTitle } from '$lib/components/ui/alert';
  import { Badge } from '$lib/components/ui/badge';
  import { Button } from '$lib/components/ui/button';
  import * as Card from '$lib/components/ui/card';
  import { Checkbox } from '$lib/components/ui/checkbox';
  import { findConflicts } from '$lib/conflicts';
  import { courses, DAY_LABELS } from '$lib/courses';
  import { buildIcs } from '$lib/ics';
  import { cn } from '$lib/utils';

  const blocks = [...new Set(courses.map((c) => `${c.startDate} → ${c.endDate}`))].sort();

  let selected = $state<string[]>([]);
  let busy = $state(false);

  const selectedCourses = $derived(
    courses
      .filter((c) => selected.includes(c.code))
      .sort((a, b) => a.startDate.localeCompare(b.startDate))
  );
  const conflicts = $derived(findConflicts(selectedCourses));
  const conflictCodes = $derived(new Set(conflicts.flatMap((c) => [c.a.code, c.b.code])));

  const canExport = $derived(selected.length > 0);

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

  async function share() {
    const file = new File([buildIcs(selectedCourses)], icsFileName(), {
      type: 'text/calendar'
    });
    const nav = navigator as Navigator & { canShare?: (d: ShareData) => boolean };
    if (nav.share && (!nav.canShare || nav.canShare({ files: [file] }))) {
      try {
        busy = true;
        await nav.share({ files: [file], title: 'NUSRI ECE AY26/27 schedule' });
        return;
      } catch (e) {
        if ((e as Error).name === 'AbortError') return;
        // fall through to download
      } finally {
        busy = false;
      }
    }
    download();
  }

  function download() {
    const a = document.createElement('a');
    a.href = icsHref();
    a.download = icsFileName();
    document.body.append(a);
    a.click();
    a.remove();
    toast.success('Calendar file downloaded', {
      description: 'Open it to import all sessions into your calendar app.'
    });
  }
</script>

<main class="mx-auto flex min-h-dvh w-full max-w-5xl flex-col gap-8 px-4 py-8 sm:px-6 sm:py-12">
  <header class="flex flex-col gap-2 text-center sm:items-center">
    <Badge variant="secondary" class="w-fit">NUSRI Suzhou · ECE · AY 2026/27</Badge>
    <h1 class="text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
      Build your course calendar
    </h1>
    <p class="text-muted-foreground max-w-prose text-pretty sm:text-lg">
      Tick the courses you're taking, then export a ready-to-import calendar file. All weekday
      sessions (Mon–Fri) are included automatically.
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
    Chinese public holidays falling inside teaching blocks are skipped: Qingming Festival, 3–5 Apr
    2027 (provisional — the State Council's official 2027 arrangement is expected in Nov 2026).
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
        <Button variant="outline" onclick={download} disabled={!canExport || busy}>
          <Download />
          Download .ics
        </Button>
        <Button onclick={share} disabled={!canExport || busy}>
          <Share2 />
          Share / Add to calendar
        </Button>
      </div>
    </div>
  </section>
</main>
