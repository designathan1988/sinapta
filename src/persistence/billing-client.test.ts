import { describe, expect, it } from "vitest";
import {
  createTestApp,
  requestSync,
  syncCommands,
  type SyncRequest,
} from "../state/index.ts";
import { answerBilling, isBillingRequest } from "./billing-client.ts";
import type { Sync } from "./sync-session.ts";

const CARD = {
  number: "4242424242424242",
  expMonth: 12,
  expYear: 2030,
  cvc: "123",
  name: "Ada",
};
const KEPT = {
  brand: "visa",
  last4: "4242",
  expMonth: 12,
  expYear: 2030,
  name: "Ada",
};

// A server that answers each path from a list, and notes what was asked.
function setup(answers: Record<string, [number, unknown]>) {
  const app = createTestApp({ commands: syncCommands });
  const asked: string[] = [];
  const send = (input: RequestInfo | URL) => {
    const path = typeof input === "string" ? input : "";
    asked.push(path);
    const [status, body] = answers[path] ?? [404, {}];
    return Promise.resolve(new Response(JSON.stringify(body), { status }));
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
  const target = { workspaceId: "w1", relist: () => Promise.resolve() };
  const ask = async (request: SyncRequest) => {
    app.dispatch(requestSync.create({ request }));
    if (isBillingRequest(request)) await answerBilling(sync, request, target);
  };
  const billing = () => app.store.getState().persistence.sync.billing;
  return { app, asked, ask, billing };
}

const BASE = "/api/workspaces/w1";

describe("billing on the server", () => {
  it("shows why an upgrade is refused, then upgrades once a card is added", async () => {
    const answers: Record<string, [number, unknown]> = {
      [`${BASE}/billing`]: [200, { card: null, invoices: [] }],
    };
    const { asked, ask, billing, app } = setup(answers);
    answers[`${BASE}/plan`] = [402, { error: "payment-required" }];

    await ask({ kind: "plan", plan: "plus" });
    expect(billing()).toMatchObject({
      error: "payment-required",
      wanted: "plus",
    });

    answers[`${BASE}/billing/card`] = [200, { card: KEPT }];
    answers[`${BASE}/plan`] = [204, undefined];
    answers[`${BASE}/billing`] = [200, { card: KEPT, invoices: [] }];
    await ask({ kind: "add-card", card: CARD });

    expect(asked.filter((path) => path === `${BASE}/plan`)).toHaveLength(2);
    expect(billing()).toMatchObject({ card: KEPT, error: null });
    expect(app.store.getState().persistence.sync.request).toBeNull();
  });

  it("lets go of a declined card's number and says why", async () => {
    const { ask, billing, app } = setup({
      [`${BASE}/billing/card`]: [402, { error: "card-declined" }],
    });

    await ask({ kind: "add-card", card: CARD });

    expect(billing()).toMatchObject({ error: "card-declined", card: null });
    expect(app.store.getState().persistence.sync.request).toBeNull();
  });
});
