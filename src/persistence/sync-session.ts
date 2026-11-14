// One joined workspace on the server (ADR-0013): its event stream, the
// last sequence applied, and this client's transactions not yet confirmed,
// sent one at a time so that the server keeps their order.
import {
  parseWireOperations,
  toWireOperations,
  type Operation,
  type PropsSchemas,
} from "../model/index.ts";
import { currentRecords } from "./sync-records.ts";
import {
  applyRemote,
  setConnection,
  setPresence,
  type AppState,
  type AppStore,
  type Transaction,
  type Dispatch,
} from "../state/index.ts";
import type { Fetch } from "./account-client.ts";
import type { Outbox } from "./workspace-repository.ts";
import { parseReply } from "./account.schema.ts";
import { rebase, type Pending } from "./sync-rebase.ts";
import {
  readLoggedEvent,
  readPresenceEvent,
  type Logged,
} from "./sync.schema.ts";

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
  readonly outbox?: Outbox;
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
  // Changes made here while the workspace is being read (joining, or
  // reading it again), made again on it once read.
  held: (readonly Operation[])[];
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

// Keeps the unconfirmed transactions, so that a reload or a lost
// connection does not lose them.
export function keepOutbox(link: Link, session: Session): void {
  const entries = session.pending.map((entry) => entry.operations);
  void link.sync?.outbox.save({ workspaceId: session.id, entries });
}

// Sends the oldest unsent transaction, then the next, and tries again a
// little later when the server cannot be reached.
export function flush(link: Link, session: Session): void {
  const { sync } = link;
  if (sync === undefined || session.isSending || session.unsent === 0) return;
  const entry = session.pending[session.pending.length - session.unsent];
  if (entry === undefined) return;
  session.isSending = true;
  sync.dispatch(setConnection.create({ connection: "syncing" }));
  const path = `/api/workspaces/${session.id}/operations`;
  const body = { clientId: session.clientId, operations: entry.operations };
  getJson(sync.send, path, body).then(
    () => {
      session.isSending = false;
      session.unsent -= 1;
      if (session.unsent === 0) {
        sync.dispatch(setConnection.create({ connection: "synced" }));
      }
      flush(link, session);
    },
    () => {
      session.isSending = false;
      sync.dispatch(setConnection.create({ connection: "offline" }));
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
  if (logged.clientId === session.clientId) {
    session.pending.shift();
    keepOutbox(link, session);
  } else applyOthers(link, session, logged);
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
  session.events.addEventListener("presence", (event) => {
    const text: unknown = event.data;
    const presence =
      typeof text === "string" ? readPresenceEvent(text) : undefined;
    if (presence !== undefined) sync.dispatch(setPresence.create({ presence }));
  });
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

// A transaction made here: sent in turn while the workspace is joined, or
// held while it is being read, to be made again on it once read; nothing
// while no one is signed in.
export function track(
  link: Link,
  transaction: Transaction,
  state: AppState,
): void {
  const session = link.session;
  const isJoined = session?.isReady === true;
  if (!isJoined && state.persistence.account.user === null) return;
  const records = currentRecords(state.workspace);
  const operations = toWireOperations(transaction.applied, records);
  if (operations.length === 0) return;
  if (session === undefined || !isJoined) {
    link.held.push(operations);
    return;
  }
  session.pending.push({ operations, inverse: transaction.inverse });
  session.unsent += 1;
  keepOutbox(link, session);
  flush(link, session);
}

// The changes held while the workspace was read, taken to be made again.
export function takeHeld(link: Link): (readonly Operation[])[] {
  const held = link.held;
  link.held = [];
  return held;
}

// A session's first unconfirmed changes, sent once it is ready.
export function startPending(session: Session, pending: readonly Pending[]) {
  session.pending = [...pending];
  session.unsent = pending.length;
}
