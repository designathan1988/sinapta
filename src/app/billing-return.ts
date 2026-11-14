// Back from the payment processor's page (?billing=saved, failed or
// cancelled): Settings › Billing opens again, and the card is read once
// the workspace is open. The mark is taken out of the address.
import {
  openOverlay,
  requestSync,
  type AppStore,
  type Dispatch,
} from "../state/index.ts";
import { SETTINGS_OVERLAY_KIND } from "../ui/shortcuts/index.ts";

function takeOutcome(): string | null {
  if (!("location" in globalThis)) return null;
  const url = new URL(window.location.href);
  const outcome = url.searchParams.get("billing");
  if (outcome === null) return null;
  url.searchParams.delete("billing");
  window.history.replaceState(null, "", url.href);
  return outcome;
}

export function openBillingOnReturn(store: AppStore, dispatch: Dispatch): void {
  if (takeOutcome() === null) return;
  const overlay = { kind: SETTINGS_OVERLAY_KIND, anchorId: "billing" };
  dispatch(openOverlay.create({ overlay }));
  const ask = (): boolean => {
    if (store.getState().persistence.sync.workspaceId === null) return false;
    dispatch(requestSync.create({ request: { kind: "billing" } }));
    return true;
  };
  if (ask()) return;
  // Subscribers never dispatch while notified: the ask waits a turn.
  const stop = store.subscribe(() => {
    if (store.getState().persistence.sync.workspaceId === null) return;
    stop();
    queueMicrotask(() => {
      ask();
    });
  });
}
