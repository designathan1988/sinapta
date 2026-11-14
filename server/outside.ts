// The web, as the server reaches it for connected apps (ADR-0013): with a
// time limit, no redirects to follow, and no host on this machine or its
// network, so a connection cannot be pointed back inside.
import type { Outside } from "./api.ts";
import { isFetchable } from "./link-preview.ts";

const TIME_LIMIT_MS = 8000;
const MAX_CHARS = 1_000_000;

export const webOutside: Outside = {
  getText: async (url) => {
    if (!isFetchable(url)) return undefined;
    try {
      const response = await fetch(url, {
        redirect: "error",
        signal: AbortSignal.timeout(TIME_LIMIT_MS),
      });
      if (!response.ok) return undefined;
      return (await response.text()).slice(0, MAX_CHARS);
    } catch {
      return undefined;
    }
  },
  postJson: async (url, body) => {
    if (!isFetchable(url)) return;
    try {
      await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        redirect: "error",
        signal: AbortSignal.timeout(TIME_LIMIT_MS),
      });
    } catch {
      // A channel that cannot be reached misses the notice, as a phone
      // that is off misses a push.
    }
  },
};
