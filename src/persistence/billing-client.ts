// Settings › Billing and the plan on the server: reads the card and the
// invoices, sends a card once and lets go of it, and changes the plan,
// telling the person why a payment was refused. A plan refused for want
// of a card is asked again once one is added.
import {
  setBilling,
  setBillingError,
  type SyncRequest,
} from "../state/index.ts";
import { parseReply } from "./account.schema.ts";
import { readBilling, readBillingRefusal } from "./billing.schema.ts";
import type { Sync } from "./sync-session.ts";

export type BillingRequest = Extract<
  SyncRequest,
  { kind: "billing" | "add-card" | "remove-card" | "plan" }
>;

const KINDS: ReadonlySet<string> = new Set([
  "billing",
  "add-card",
  "remove-card",
  "plan",
]);

export function isBillingRequest(
  request: SyncRequest,
): request is BillingRequest {
  return KINDS.has(request.kind);
}

interface Asked {
  readonly ok: boolean;
  readonly body: unknown;
}

async function ask(sync: Sync, path: string, body?: unknown): Promise<Asked> {
  const response = await sync.send(path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  return { ok: response.ok, body: parseReply(await response.text()) };
}

function publish(sync: Sync, asked: Asked): boolean {
  const billing = asked.ok ? readBilling(asked.body) : undefined;
  if (billing !== undefined) {
    sync.dispatch(setBilling.create(billing));
    return true;
  }
  const error = readBillingRefusal(asked.body);
  if (error !== undefined) sync.dispatch(setBillingError.create({ error }));
  return false;
}

export interface BillingTarget {
  readonly workspaceId: string | null;
  // Asks for the workspace list again, where each workspace's plan is.
  readonly relist: () => Promise<void>;
}

// Where a request goes: the client, the workspace's path, and how to
// read the workspace list again.
interface Place {
  readonly sync: Sync;
  readonly base: string;
  readonly relist: () => Promise<void>;
}

async function changePlan(
  { sync, base, relist }: Place,
  request: Extract<BillingRequest, { kind: "plan" }>,
): Promise<void> {
  const asked = await ask(sync, `${base}/plan`, { plan: request.plan });
  await relist();
  publish(sync, await ask(sync, `${base}/billing`));
  // Said after the billing is read again, which clears what was said.
  if (!asked.ok) {
    const error = readBillingRefusal(asked.body) ?? "card-declined";
    sync.dispatch(setBillingError.create({ error, wanted: request.plan }));
  }
}

async function addCard(
  place: Place,
  request: Extract<BillingRequest, { kind: "add-card" }>,
): Promise<void> {
  const { sync, base } = place;
  const added = await ask(sync, `${base}/billing/card`, request.card);
  if (!added.ok) {
    publish(sync, added);
    return;
  }
  const wanted = sync.store.getState().persistence.sync.billing?.wanted;
  if (wanted !== null && wanted !== undefined) {
    await changePlan(place, { kind: "plan", plan: wanted });
    return;
  }
  publish(sync, await ask(sync, `${base}/billing`));
}

export async function answerBilling(
  sync: Sync,
  request: BillingRequest,
  target: BillingTarget,
): Promise<void> {
  if (target.workspaceId === null) return;
  const base = `/api/workspaces/${target.workspaceId}`;
  const place = { sync, base, relist: target.relist };
  switch (request.kind) {
    case "billing":
      publish(sync, await ask(sync, `${base}/billing`));
      return;
    case "remove-card":
      publish(sync, await ask(sync, `${base}/billing/card/remove`, {}));
      return;
    case "add-card":
      await addCard(place, request);
      return;
    case "plan":
      await changePlan(place, request);
      return;
  }
}
