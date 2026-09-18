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

export function isWindows(ua = userAgent()): boolean {
  return /Windows/.test(ua);
}
