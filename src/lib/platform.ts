function userAgent(): string {
  return typeof navigator === 'undefined' ? '' : navigator.userAgent;
}

function touchPoints(): number {
  if (typeof navigator === 'undefined') return 0;
  return navigator.maxTouchPoints ?? 0;
}

/** iPhone/iPad/iPod, incl. iPadOS masquerading as Mac. */
export function isAppleMobile(ua = userAgent(), touch = touchPoints()): boolean {
  return /iP(hone|ad|od)/.test(ua) || (/Macintosh/.test(ua) && touch > 1);
}

export function isApple(ua = userAgent(), touch = touchPoints()): boolean {
  return isAppleMobile(ua, touch) || /Macintosh/.test(ua);
}

export function isAndroid(ua = userAgent()): boolean {
  return /Android/.test(ua);
}

export function isWindows(ua = userAgent()): boolean {
  return /Windows/.test(ua);
}

/** Phones/tablets, where share sheets and file flows differ from desktop. */
export function isMobile(ua = userAgent(), touch = touchPoints()): boolean {
  return isAppleMobile(ua, touch) || isAndroid(ua);
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
