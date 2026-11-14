import { readFileSync } from "node:fs";
import { describe, expect, it, vi } from "vitest";
import { isPushScope, listenForPush } from "./service-worker-push.ts";

function fakeScope(openTabs: { focus: () => Promise<unknown> }[] = []) {
  const listeners = new Map<string, (event: unknown) => void>();
  const showNotification = vi.fn(() => Promise.resolve());
  const openWindow = vi.fn(() => Promise.resolve(undefined));
  const scope = {
    registration: { showNotification },
    clients: {
      matchAll: () =>
        Promise.resolve(openTabs.map((tab) => ({ url: "/", ...tab }))),
      openWindow,
    },
    addEventListener: (type: string, listener: (event: unknown) => void) => {
      listeners.set(type, listener);
    },
  };
  if (!isPushScope(scope)) throw new Error("not a push scope");
  listenForPush(scope);
  const waits: Promise<unknown>[] = [];
  const fire = (type: string, extra: object) => {
    listeners.get(type)?.({
      waitUntil: (promise: Promise<unknown>) => waits.push(promise),
      ...extra,
    });
    return Promise.all(waits);
  };
  return { fire, showNotification, openWindow };
}

describe("the service worker's push", () => {
  it("shows a pushed notice as the system's notification", async () => {
    const { fire, showNotification } = fakeScope();

    await fire("push", {
      data: {
        json: () => ({
          title: "Pagecraft",
          body: "Ada mentioned you",
          url: "/",
        }),
      },
    });

    expect(showNotification).toHaveBeenCalledWith("Pagecraft", {
      body: "Ada mentioned you",
      data: "/",
      tag: "pagecraft-notice",
    });
  });

  it("shows nothing for a push it cannot read", async () => {
    const { fire, showNotification } = fakeScope();

    await fire("push", { data: { json: () => ({ title: 1 }) } });

    expect(showNotification).not.toHaveBeenCalled();
  });

  it("opens the app on a click, or brings an open tab forward", async () => {
    const closed = fakeScope();
    const focus = vi.fn(() => Promise.resolve());
    const open = fakeScope([{ focus }]);
    const click = { notification: { close: () => undefined, data: "/" } };

    await closed.fire("notificationclick", click);
    await open.fire("notificationclick", click);

    expect(closed.openWindow).toHaveBeenCalledWith("/");
    expect(focus).toHaveBeenCalledTimes(1);
    expect(open.openWindow).not.toHaveBeenCalled();
  });
});

describe("the service worker's own code", () => {
  // A classic service worker cannot load the app's shared chunks: its
  // files import nothing but each other, or registration fails.
  it("imports only its own files", () => {
    const files = [
      "service-worker.ts",
      "service-worker-push.ts",
      "push-notice.schema.ts",
      "offline-cache.ts",
    ];
    const imports = files.flatMap((file) =>
      [
        ...readFileSync(new URL(file, import.meta.url), "utf8").matchAll(
          /from "([^"]+)"/g,
        ),
      ].map((found) => found[1] ?? ""),
    );

    expect(imports.filter((path) => !files.includes(path.slice(2)))).toEqual(
      [],
    );
  });
});
