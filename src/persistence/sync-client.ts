// Keeps the signed-in workspace on the server (ADR-0013): joins it or
// uploads the browser's copy, sends each transaction in order, and applies
// the others' as the server's event stream brings them.
import {
  createEmptyWorkspace,
  toWireOperations,
  type Workspace,
} from "../model/index.ts";
import {
  loadServerWorkspace,
  requestSync,
  setWorkspaces,
  type AccountStatus,
  type SyncRequest,
  type AppState,
  type Transaction,
} from "../state/index.ts";
import { parseReply } from "./account.schema.ts";
import { answerPeople } from "./people-client.ts";
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

// A new workspace on the server: the browser's copy at the first sign-in,
// an empty one when asked for (Notion's "New workspace").
async function create(link: Link, sync: Sync, made: Made) {
  const snapshot = parseReply(serializeWorkspace(made.workspace));
  const body = { name: made.name, snapshot };
  const created = reply.readCreated(
    await getJson(sync.send, "/api/workspaces", body),
  );
  if (created === undefined) return;
  if (made.isEmpty) {
    sync.dispatch(loadServerWorkspace.create({ workspace: made.workspace }));
  }
  ready(link, listen(link, sync, created.workspace.id), created.seq);
  await publishList(sync, created.workspace.id);
}

interface Made {
  readonly name: string;
  readonly workspace: Workspace;
  readonly isEmpty: boolean;
}

// The server's list of this person's workspaces, with the one joined.
async function publishList(sync: Sync, joined: string | null) {
  const list = reply.readWorkspaceList(
    await getJson(sync.send, "/api/workspaces"),
  );
  if (list === undefined) return list;
  const workspaceId = joined ?? list.lastWorkspaceId;
  sync.dispatch(
    setWorkspaces.create({ workspaces: list.workspaces, workspaceId }),
  );
  return list;
}

// Joins the workspace asked for, else the one opened last, else the first;
// with none, the browser's copy becomes the person's first workspace.
async function join(link: Link, sync: Sync, wanted?: string): Promise<void> {
  const { user } = sync.store.getState().persistence.account;
  if (user === null) return;
  const list = await publishList(sync, wanted ?? null);
  const ids = list?.workspaces.map((workspace) => workspace.id) ?? [];
  const chosen = [wanted, list?.lastWorkspaceId, ids[0]].find(
    (id) => id !== undefined && id !== null && ids.includes(id),
  );
  if (typeof chosen !== "string") {
    const workspace = sync.store.getState().workspace;
    const name = `${user.name}'s Pagecraft`;
    await create(link, sync, { name, workspace, isEmpty: false });
    return;
  }
  sync.dispatch(
    setWorkspaces.create({
      workspaces: list?.workspaces ?? [],
      workspaceId: chosen,
    }),
  );
  await getJson(sync.send, `/api/workspaces/${chosen}/open`, {});
  await download(link, sync, listen(link, sync, chosen));
  // The workspace's people, for "@" and the comments' authors.
  sync.dispatch(requestSync.create({ request: { kind: "people" } }));
}

function leave(link: Link): void {
  link.session?.events.close();
  delete link.session;
}

// Joins another workspace or makes a new one, as the switcher asks; the
// other requests go to the people client and keep the workspace open.
function answer(link: Link, sync: Sync, request: SyncRequest): void {
  if (request.kind !== "switch" && request.kind !== "create") {
    const { workspaceId } = sync.store.getState().persistence.sync;
    void answerPeople(sync, request, workspaceId).then(() =>
      request.kind === "rename" ? publishList(sync, workspaceId) : undefined,
    );
    return;
  }
  leave(link);
  if (request.kind === "switch") {
    void join(link, sync, request.workspaceId);
    return;
  }
  const workspace = createEmptyWorkspace();
  void create(link, sync, { name: request.name, workspace, isEmpty: true });
}

const PRESENCE_MS = 30_000;

// Tells the server which page this person has open, so that the others
// see their face on it.
function announce(link: Link, sync: Sync): void {
  const session = link.session;
  if (session?.isReady !== true) return;
  const pageId = sync.store.getState().ui.activePageId;
  const path = `/api/workspaces/${session.id}/presence`;
  getJson(sync.send, path, { pageId }).catch(() => undefined);
}

function followPage(link: Link, sync: Sync): void {
  let pageId = sync.store.getState().ui.activePageId;
  let wasReady = false;
  sync.store.subscribe((state) => {
    const isReady = link.session?.isReady === true;
    if (state.ui.activePageId === pageId && isReady === wasReady) return;
    pageId = state.ui.activePageId;
    wasReady = isReady;
    announce(link, sync);
  });
  setInterval(() => {
    announce(link, sync);
  }, PRESENCE_MS);
}

function follow(link: Link, sync: Sync): void {
  const state = sync.store.getState();
  let status: AccountStatus = state.persistence.account.status;
  let asked = state.persistence.sync.requestCount;
  sync.store.subscribe((next) => {
    const { request, requestCount } = next.persistence.sync;
    if (request !== null && requestCount !== asked) {
      asked = requestCount;
      answer(link, sync, request);
    }
    const now = next.persistence.account.status;
    if (now === status) return;
    status = now;
    if (now === "signed-in") void join(link, sync);
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
      followPage(link, sync);
    },
  };
}
