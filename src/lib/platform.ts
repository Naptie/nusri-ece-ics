/** Apple mobile detection (iPhone/iPad/iPod, incl. iPadOS masquerading as Mac). */
export function isAppleMobile(): boolean {
  if (typeof navigator === 'undefined') return false;
  const ua = navigator.userAgent;
  return /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && (navigator.maxTouchPoints ?? 0) > 1);
}

export function isApple(): boolean {
  if (typeof navigator === 'undefined') return false;
  return isAppleMobile() || /Macintosh/.test(navigator.userAgent);
}

/**
 * Whether the browser can hand `.ics` files to the system share sheet
 * (Android/desktop Chromium). Hidden on iOS: Safari accepts the file, but the
 * share sheet offers no Calendar target, so it would just re-implement the
 * download path with extra steps.
 */
export function canShareIcsFile(): boolean {
  if (typeof navigator === 'undefined' || !navigator.canShare || !navigator.share) return false;
  try {
    const file = new File(['BEGIN:VCALENDAR\r\nEND:VCALENDAR\r\n'], 't.ics', {
      type: 'text/calendar'
    });
    return navigator.canShare({ files: [file] });
  } catch {
    return false;
  }
}
