<script lang="ts">
  import '../app.css';
  import favicon from '$lib/assets/favicon.svg';
  import { Toaster } from '$lib/components/ui/sonner';

  let { children } = $props();
</script>

<svelte:head>
  <link rel="icon" href={favicon}>
  <title>NUSRI ECE Schedule → Calendar</title>
  <meta
    name="description"
    content="Pick your ECE courses at NUSRI (Suzhou) and export a ready-to-import .ics calendar for AY 2026/27."
  >
  <meta name="theme-color" content="#0a0a0a">
</svelte:head>

<Toaster position="top-center" richColors />
{@render children()}
