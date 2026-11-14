// Keeps the signed-in workspace on the server (ADR-0013): joins it or
// uploads the browser's copy, sends each transaction in order, and applies
// the others' as the server's event stream brings them.
import { toWireOperations, type Workspace } from "../model/index.ts";
import {
  loadServerWorkspace,
  type AccountStatus,
  type AppState,
  type Transaction,
} from "../state/index.ts";
import { parseReply } from "./account.schema.ts";
import {
  flush,
  getJson,
  listen,
  ready,
  type Link,
  type Session,
  type Sync,
  type SyncOptions,
} from "./sync-session.ts";
import * as reply from "./sync.schema.ts";
import { readWorkspaceFile, serializeWorkspace } from "./workspace-file.ts";

export type { EventsLike, SyncOptions } from "./sync-session.ts";

export interface SyncLink {
  readonly onTransaction: (transaction: Transaction, state: AppState) => void;
  readonly start: (options: SyncOptions) => void;
}

function currentRecords(workspace: Workspace) {
  return {
    block: (id: keyof Workspace["blocks"]) => workspace.blocks[id],
    view: (id: keyof Workspace["views"]) => workspace.views[id],
    settings: workspace.settings,
  };
}

// Reads the server's workspace, replaces the browser's copy with it, then
// applies the operations made since its snapshot.
async function download(link: Link, sync: Sync, session: Session) {
  const path = `/api/workspaces/${session.id}`;
  const loaded = reply.readDownload(await getJson(sync.send, path));
  if (loaded === undefined) return;
  const text = JSON.stringify(loaded.snapshot);
  const file = readWorkspaceFile(text, sync.propsSchemas);
  if (!file.ok) return;
  sync.dispatch(loadServerWorkspace.create({ workspace: file.workspace }));
  session.buffered = [...loaded.operations, ...session.buffered];
  ready(link, session, loaded.seq);
}

// The first sign-in on a server with no workspace for this person: the
// browser's copy becomes the server's.
async function upload(link: Link, sync: Sync, name: string) {
  const workspace = sync.store.getState().workspace;
  const snapshot = parseReply(serializeWorkspace(workspace));
  const body = { name, snapshot };
  const created = reply.readCreated(
    await getJson(sync.send, "/api/workspaces", body),
  );
  if (created === undefined) return;
  ready(link, listen(link, sync, created.workspace.id), created.seq);
}

async function join(link: Link, sync: Sync): Promise<void> {
  const { user } = sync.store.getState().persistence.account;
  if (user === null) return;
  const list = await getJson(sync.send, "/api/workspaces");
  const first = reply.readWorkspaceList(list)?.[0];
  if (first === undefined) {
    await upload(link, sync, `${user.name}'s Pagecraft`);
    return;
  }
  await download(link, sync, listen(link, sync, first.id));
}

function leave(link: Link): void {
  link.session?.events.close();
  delete link.session;
}

function follow(link: Link, sync: Sync): void {
  let status: AccountStatus = sync.store.getState().persistence.account.status;
  sync.store.subscribe((state) => {
    const next = state.persistence.account.status;
    if (next === status) return;
    status = next;
    if (next === "signed-in") void join(link, sync);
    else leave(link);
  });
  if (status === "signed-in") void join(link, sync);
}

// The link exists before the dispatcher, which tells it of every
// transaction; it starts working once someone signs in.
export function createSyncLink(): SyncLink {
  const link: Link = {
    resync: () => {
      leave(link);
      if (link.sync !== undefined) void join(link, link.sync);
    },
  };
  return {
    onTransaction(transaction, state) {
      const session = link.session;
      if (session?.isReady !== true) return;
      const records = currentRecords(state.workspace);
      const operations = toWireOperations(transaction.applied, records);
      if (operations.length === 0) return;
      session.pending.push({ operations, inverse: transaction.inverse });
      session.unsent += 1;
      flush(link, session);
    },
    start(given) {
      const sync: Sync = {
        send: (input, init) => fetch(input, init),
        openEvents: (url) => new EventSource(url),
        ...given,
      };
      link.sync = sync;
      follow(link, sync);
    },
  };
}
