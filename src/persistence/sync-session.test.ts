import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createTestApp, type Command } from "../state/index.ts";
import { flush, type Link, type Session } from "./sync-session.ts";

beforeEach(() => {
  vi.useFakeTimers();
});

afterEach(() => {
  vi.useRealTimers();
});

function session(unsent: number): Session {
  const entry = { operations: [], inverse: [] };
  return {
    id: "w1",
    clientId: "c1",
    events: { addEventListener: () => undefined, close: () => undefined },
    seq: 0,
    isReady: true,
    buffered: [],
    pending: Array.from({ length: unsent }, () => entry),
    unsent,
    isSending: false,
  };
}

// A link whose server fails the first `failures` sends, then takes them.
function linkFailing(failures: number) {
  const { store } = createTestApp();
  const sent: Command[] = [];
  let calls = 0;
  const send = vi.fn(() => {
    calls += 1;
    return Promise.resolve(
      calls <= failures
        ? new Response("", { status: 503 })
        : Response.json({ seq: calls }),
    );
  });
  const link: Link = {
    resync: () => undefined,
    sync: {
      store,
      dispatch: (command) => {
        sent.push(command);
        return { ok: true };
      },
      propsSchemas: new Map(),
      send,
      openEvents: () => session(0).events,
      outbox: {
        load: () => Promise.resolve(undefined),
        save: () => Promise.resolve(),
      },
    },
  };
  const connections = () =>
    sent.flatMap((command) =>
      "connection" in command ? [command.connection] : [],
    );
  return { link, send, connections };
}

describe("the outbox", () => {
  it("sends each transaction in turn, then says synced", async () => {
    const { link, send, connections } = linkFailing(0);
    const joined = session(2);

    flush(link, joined);
    await vi.runAllTimersAsync();

    expect(send).toHaveBeenCalledTimes(2);
    expect(joined.unsent).toBe(0);
    expect(connections()).toEqual(["syncing", "syncing", "synced"]);
  });

  it("says offline when the server cannot be reached, and tries again", async () => {
    const { link, send, connections } = linkFailing(1);
    const joined = session(1);

    flush(link, joined);
    await vi.advanceTimersByTimeAsync(0);
    const whileDown = { calls: send.mock.calls.length, unsent: joined.unsent };
    await vi.advanceTimersByTimeAsync(2000);

    expect(whileDown).toEqual({ calls: 1, unsent: 1 });
    expect(send).toHaveBeenCalledTimes(2);
    expect(joined.unsent).toBe(0);
    expect(connections()).toEqual(["syncing", "offline", "syncing", "synced"]);
  });
});
