// One joined workspace on the server (ADR-0013): its event stream, the
// last sequence applied, and this client's transactions not yet confirmed,
// sent one at a time so that the server keeps their order.
import { parseWireOperations, type PropsSchemas } from "../model/index.ts";
import { applyRemote, type AppStore, type Dispatch } from "../state/index.ts";
import type { Fetch } from "./account-client.ts";
import { parseReply } from "./account.schema.ts";
import { rebase, type Pending } from "./sync-rebase.ts";
import { readLoggedEvent, type Logged } from "./sync.schema.ts";

export interface EventsLike {
  addEventListener(type: string, listener: (event: MessageEvent) => void): void;
  close(): void;
}

export interface SyncOptions {
  readonly store: AppStore;
  readonly dispatch: Dispatch;
  readonly propsSchemas: PropsSchemas;
  readonly send?: Fetch;
  readonly openEvents?: (url: string) => EventsLike;
}

export type Sync = Required<SyncOptions>;

export interface Session {
  readonly id: string;
  readonly clientId: string;
  readonly events: EventsLike;
  seq: number;
  isReady: boolean;
  buffered: Logged[];
  pending: Pending[];
  unsent: number;
  isSending: boolean;
}

// What the client's parts share: the options once started, the joined
// session, and how to read the whole workspace again.
export interface Link {
  sync?: Sync;
  session?: Session;
  resync: () => void;
}

const RETRY_MS = 2000;

export async function getJson(send: Fetch, path: string, body?: unknown) {
  const response = await send(path, {
    method: body === undefined ? "GET" : "POST",
    headers: { "Content-Type": "application/json" },
    credentials: "same-origin",
    ...(body === undefined ? {} : { body: JSON.stringify(body) }),
  });
  if (!response.ok) throw new Error(`${path}: ${String(response.status)}`);
  return parseReply(await response.text());
}

// Sends the oldest unsent transaction, then the next, and tries again a
// little later when the server cannot be reached.
export function flush(link: Link, session: Session): void {
  const { sync } = link;
  if (sync === undefined || session.isSending || session.unsent === 0) return;
  const entry = session.pending[session.pending.length - session.unsent];
  if (entry === undefined) return;
  session.isSending = true;
  const path = `/api/workspaces/${session.id}/operations`;
  const body = { clientId: session.clientId, operations: entry.operations };
  getJson(sync.send, path, body).then(
    () => {
      session.isSending = false;
      session.unsent -= 1;
      flush(link, session);
    },
    () => {
      session.isSending = false;
      setTimeout(() => {
        flush(link, session);
      }, RETRY_MS);
    },
  );
}

// The others' transaction, applied after taking this client's unconfirmed
// ones back; anything unexpected reads the whole workspace again.
function applyOthers(link: Link, session: Session, logged: Logged): void {
  const { sync } = link;
  if (sync === undefined) return;
  const remote = parseWireOperations(logged.operations);
  const workspace = sync.store.getState().workspace;
  const next =
    remote === undefined
      ? undefined
      : rebase(workspace, session.pending, remote);
  const isWhole = next?.pending.length === session.pending.length;
  if (next === undefined || !isWhole) {
    link.resync();
    return;
  }
  if (!sync.dispatch(applyRemote.create({ operations: next.operations })).ok) {
    link.resync();
    return;
  }
  session.pending = [...next.pending];
}

export function receive(link: Link, session: Session, logged: Logged): void {
  if (logged.seq <= session.seq) return;
  if (logged.seq !== session.seq + 1) {
    link.resync();
    return;
  }
  session.seq = logged.seq;
  if (logged.clientId === session.clientId) session.pending.shift();
  else applyOthers(link, session, logged);
}

// Applies what came while the workspace was being read, then the rest as
// it comes.
export function ready(link: Link, session: Session, seq: number): void {
  session.seq = seq;
  session.isReady = true;
  const waiting = session.buffered;
  session.buffered = [];
  for (const logged of waiting) receive(link, session, logged);
}

export function listen(link: Link, sync: Sync, id: string): Session {
  const session: Session = {
    id,
    clientId: crypto.randomUUID(),
    events: sync.openEvents(`/api/workspaces/${id}/events`),
    seq: 0,
    isReady: false,
    buffered: [],
    pending: [],
    unsent: 0,
    isSending: false,
  };
  session.events.addEventListener("operations", (event) => {
    const text: unknown = event.data;
    const logged = typeof text === "string" ? readLoggedEvent(text) : undefined;
    if (logged === undefined) return;
    if (session.isReady) receive(link, session, logged);
    else session.buffered.push(logged);
  });
  link.session = session;
  return session;
}
