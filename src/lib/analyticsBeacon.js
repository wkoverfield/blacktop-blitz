/**
 * Unload-safe analytics send.
 *
 * Mutations queued on the Convex websocket while the page is being hidden
 * or torn down are frequently dropped. This posts straight to the Convex
 * HTTP API with `fetch(..., { keepalive: true })`, which the browser lets
 * outlive the page. (`navigator.sendBeacon` is not usable here: it cannot
 * send `application/json`, and the endpoint rejects any other content type.)
 *
 * Returns true when the request was handed to the browser, false when it
 * could not be (no Convex URL configured, or fetch threw). Never throws.
 */
const convexUrl =
  import.meta.env.VITE_CONVEX_URL || import.meta.env.REACT_APP_CONVEX_URL;

export function beaconTrackEvent(eventType, metadata) {
  if (!convexUrl || typeof fetch !== "function") return false;
  try {
    fetch(`${convexUrl.replace(/\/$/, "")}/api/mutation`, {
      method: "POST",
      keepalive: true,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        path: "analytics:trackEvent",
        args: { eventType, metadata },
        format: "json",
      }),
    }).catch(() => {});
    return true;
  } catch {
    return false;
  }
}
