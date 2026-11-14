// Keeps this browser's push subscription with the server while Settings ›
// Notifications asks for push (ADR-0013): turned on, the browser subscribes
// with the server's key and the server stores the subscription; turned
// off or logged out, the subscription is dropped on both sides.
import type { AppState, AppStore } from "../state/index.ts";
import type { Fetch } from "./account-client.ts";
import { parseReply } from "./account.schema.ts";
import { readPushKey } from "./push.schema.ts";

function isWanted(state: AppState): boolean {
  return (
    state.ui.pushNotices && state.persistence.account.status === "signed-in"
  );
}

async function registration(): Promise<ServiceWorkerRegistration | undefined> {
  if (!("serviceWorker" in navigator)) return undefined;
  if (typeof PushManager === "undefined") return undefined;
  return navigator.serviceWorker.ready;
}

function post(send: Fetch, path: string, body: unknown) {
  return send(path, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    body: JSON.stringify(body),
  });
}

async function subscribe(send: Fetch): Promise<void> {
  const worker = await registration();
  if (worker === undefined) return;
  const reply = await send("/api/push/key", { credentials: "same-origin" });
  const key = readPushKey(parseReply(await reply.text()));
  if (key === undefined) return;
  const subscription =
    (await worker.pushManager.getSubscription()) ??
    (await worker.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: key,
    }));
  await post(send, "/api/push/subscribe", subscription.toJSON());
}

async function unsubscribe(send: Fetch): Promise<void> {
  const worker = await registration();
  const subscription = await worker?.pushManager.getSubscription();
  if (subscription === undefined || subscription === null) return;
  await post(send, "/api/push/unsubscribe", {
    endpoint: subscription.endpoint,
  });
  await subscription.unsubscribe();
}

export function startPushSubscription(options: {
  readonly store: AppStore;
  readonly send?: Fetch;
}): void {
  const { store } = options;
  const send = options.send ?? ((input, init) => fetch(input, init));
  let applied = false;
  const follow = (): void => {
    const wanted = isWanted(store.getState());
    if (wanted === applied) return;
    applied = wanted;
    void (wanted ? subscribe(send) : unsubscribe(send)).catch(() => {
      applied = !wanted;
    });
  };
  store.subscribe(() => {
    queueMicrotask(follow);
  });
  follow();
}
