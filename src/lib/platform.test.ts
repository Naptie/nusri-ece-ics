import { describe, expect, test } from 'bun:test';
import { isApple, isAppleMobile, isWindows } from './platform.ts';

const MAC_SAFARI =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const IPAD_UA =
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Safari/605.1.15';
const IPHONE_UA =
  'Mozilla/5.0 (iPhone; CPU iPhone OS 17_4 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.4 Mobile/15E148 Safari/604.1';
const WINDOWS_CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36';
const ANDROID_CHROME =
  'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36';

describe('platform detection', () => {
  test('macOS desktop: apple, not mobile', () => {
    expect(isApple(MAC_SAFARI)).toBe(true);
    expect(isAppleMobile(MAC_SAFARI, 0)).toBe(false);
    expect(isWindows(MAC_SAFARI)).toBe(false);
  });

  test('iPadOS masquerading as Mac is detected as apple mobile via touch points', () => {
    expect(isApple(IPAD_UA, 5)).toBe(true);
    expect(isAppleMobile(IPAD_UA, 5)).toBe(true);
  });

  test('iPhone', () => {
    expect(isApple(IPHONE_UA, 5)).toBe(true);
    expect(isAppleMobile(IPHONE_UA, 5)).toBe(true);
  });

  test('Windows desktop: neither apple nor mobile', () => {
    expect(isApple(WINDOWS_CHROME)).toBe(false);
    expect(isAppleMobile(WINDOWS_CHROME, 0)).toBe(false);
    expect(isWindows(WINDOWS_CHROME)).toBe(true);
  });

  test('Android phone: not apple, not windows', () => {
    expect(isApple(ANDROID_CHROME, 0)).toBe(false);
    expect(isAppleMobile(ANDROID_CHROME, 0)).toBe(false);
    expect(isWindows(ANDROID_CHROME)).toBe(false);
  });
});
