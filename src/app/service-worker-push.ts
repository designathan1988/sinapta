// The service worker's part in push (ADR-0013): a notice the server
// pushes is shown by the system, even with no tab of the app open, and a
// click on it brings the app forward, or opens it.
import { readPushedNotice } from "./push-notice.schema.ts";

interface WaitingEvent extends Event {
  waitUntil(promise: Promise<unknown>): void;
}

interface PushEvent extends WaitingEvent {
  readonly data: { json(): unknown } | null;
}

interface NotificationEvent extends WaitingEvent {
  readonly notification: { close(): void; readonly data: unknown };
}

interface WindowClient {
  readonly url: string;
  focus(): Promise<unknown>;
}

interface PushScope {
  readonly registration: {
    showNotification(
      title: string,
      options: { body: string; data: string; tag: string },
    ): Promise<void>;
  };
  readonly clients: {
    matchAll(options: { type: "window" }): Promise<readonly WindowClient[]>;
    openWindow(url: string): Promise<unknown>;
  };
  addEventListener(type: "push", listener: (event: PushEvent) => void): void;
  addEventListener(
    type: "notificationclick",
    listener: (event: NotificationEvent) => void,
  ): void;
}

export function isPushScope(scope: unknown): scope is PushScope {
  return (
    typeof scope === "object" &&
    scope !== null &&
    "registration" in scope &&
    "clients" in scope
  );
}

function dataOf(event: PushEvent): unknown {
  try {
    return event.data?.json();
  } catch {
    return undefined;
  }
}

async function bringForward(scope: PushScope, url: string): Promise<void> {
  const open = await scope.clients.matchAll({ type: "window" });
  const tab = open[0];
  if (tab === undefined) await scope.clients.openWindow(url);
  else await tab.focus();
}

export function listenForPush(scope: PushScope): void {
  scope.addEventListener("push", (event) => {
    const notice = readPushedNotice(dataOf(event));
    if (notice === undefined) return;
    event.waitUntil(
      scope.registration.showNotification(notice.title, {
        body: notice.body,
        data: notice.url,
        tag: "pagecraft-notice",
      }),
    );
  });
  scope.addEventListener("notificationclick", (event) => {
    event.notification.close();
    const { data } = event.notification;
    event.waitUntil(bringForward(scope, typeof data === "string" ? data : "/"));
  });
}
