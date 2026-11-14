import { describe, expect, it } from "vitest";
import { createTestApp, syncCommands } from "../state/index.ts";
import {
  answerWebhook,
  isWebhookRequest,
  type WebhookRequest,
} from "./automation-webhook-client.ts";
import type { Sync } from "./sync-session.ts";

const REQUEST: WebhookRequest = {
  kind: "automation-webhook",
  url: "https://hooks.example.com/in",
  payload: {
    source: { type: "automation", automation_id: "a1" },
    data: { object: "page", id: "row", title: "Ship it", properties: {} },
  },
};

// A server that notes each path and body it is sent.
function setup() {
  const app = createTestApp({ commands: syncCommands });
  const sent: { path: string; body: unknown }[] = [];
  const send = (input: RequestInfo | URL, init?: RequestInit) => {
    const path = typeof input === "string" ? input : "";
    const text = typeof init?.body === "string" ? init.body : "null";
    const body: unknown = JSON.parse(text);
    sent.push({ path, body });
    return Promise.resolve(new Response("{}", { status: 200 }));
  };
  const sync: Sync = {
    store: app.store,
    dispatch: app.dispatch,
    send,
    propsSchemas: new Map(),
    openEvents: () => ({
      addEventListener: () => undefined,
      close: () => undefined,
    }),
    outbox: {
      load: () => Promise.resolve(undefined),
      save: () => Promise.resolve(),
    },
  };
  return { sync, sent };
}

describe("an automation's webhook from the client", () => {
  it("asks the open workspace's server to post the page", async () => {
    const { sync, sent } = setup();

    await answerWebhook(sync, REQUEST, "w1");

    expect(isWebhookRequest(REQUEST)).toBe(true);
    expect(sent).toEqual([
      {
        path: "/api/workspaces/w1/automation-webhook",
        body: { url: REQUEST.url, payload: REQUEST.payload },
      },
    ]);
  });

  it("sends nothing without a server workspace", async () => {
    const { sync, sent } = setup();

    await answerWebhook(sync, REQUEST, null);

    expect(sent).toEqual([]);
  });
});
