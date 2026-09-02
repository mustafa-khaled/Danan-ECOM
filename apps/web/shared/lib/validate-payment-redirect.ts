/**
 * Tap's 3-D Secure page is the only off-origin navigation checkout performs.
 * The charge object's `transaction.url` is not in Tap's signed webhook field
 * set, so the browser must refuse anything that is not Tap or our own origin
 * (the mock provider returns our checkout-return URL).
 */
export function isSafePaymentRedirectUrl(
  url: string,
  currentOrigin?: string,
): boolean {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    return false;
  }

  const host = parsed.hostname.toLowerCase();
  if (host === "tap.company" || host.endsWith(".tap.company")) {
    return parsed.protocol === "https:";
  }

  const origin =
    currentOrigin ??
    (typeof window !== "undefined" ? window.location.origin : undefined);
  if (!origin) {
    return false;
  }

  try {
    return parsed.origin === new URL(origin).origin;
  } catch {
    return false;
  }
}
