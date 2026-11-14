// Keeps the signed-in workspace on the server (ADR-0013): joins it or
// uploads the browser's copy, sends each transaction in order, and applies
// the others' as the server's event stream brings them.
import { createEmptyWorkspace, type Workspace } from "../model/index.ts";
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
import { answerSide } from "./side-requests.ts";
import { afterAnswer, type AfterSteps } from "./sync-after.ts";
import { answerTeamspaces, isTeamspaceRequest } from "./teamspace-client.ts";
import {
  flush,
  getJson,
  listen,
  ready,
  type Link,
  type Sync,
  type SyncOptions,
  startPending,
  takeHeld,
  track,
} from "./sync-session.ts";
import { withUnsent } from "./sync-outbox.ts";
import { download } from "./sync-download.ts";
import { followPage } from "./sync-presence.ts";
import * as reply from "./sync.schema.ts";
import { serializeWorkspace } from "./workspace-file.ts";

export type { EventsLike, SyncOptions } from "./sync-session.ts";

export interface SyncLink {
  readonly onTransaction: (transaction: Transaction, state: AppState) => void;
  readonly start: (options: SyncOptions) => void;
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
  // Changes made here while the copy went up are sent after it; a new,
  // empty workspace has none of them.
  const held = takeHeld(link);
  const session = listen(link, sync, created.workspace.id);
  startPending(
    session,
    withUnsent(made.workspace, made.isEmpty ? [] : held).pending,
  );
  ready(link, session, created.seq);
  flush(link, session);
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
  sync.dispatch(requestSync.create({ request: { kind: "shared" } }));
  sync.dispatch(requestSync.create({ request: { kind: "integrations" } }));
}

function leave(link: Link): void {
  link.session?.events.close();
  delete link.session;
  link.held = [];
}

function stepsOf(link: Link, sync: Sync, joined: string | null): AfterSteps {
  const name = `${sync.store.getState().persistence.account.user?.name ?? ""}'s Pagecraft`;
  return {
    relist: async () =>
      ((await publishList(sync, joined))?.workspaces.length ?? 0) > 0,
    rejoin: () => (leave(link), join(link, sync)),
    startEmpty: () => (
      leave(link),
      create(link, sync, {
        name,
        workspace: createEmptyWorkspace(),
        isEmpty: true,
      })
    ),
  };
}

// Joins another workspace or makes a new one, as the switcher asks; the
// other requests go to the people client and keep the workspace open.
function answer(link: Link, sync: Sync, request: SyncRequest): void {
  const { workspaceId } = sync.store.getState().persistence.sync;
  const relist = async () => {
    await publishList(sync, workspaceId);
  };
  if (answerSide(sync, request, { workspaceId, relist })) return;
  if (isTeamspaceRequest(request)) {
    const afterwards = {
      reload: () => {
        if (workspaceId === null) return;
        leave(link);
        void join(link, sync, workspaceId);
      },
      relist: () => void publishList(sync, workspaceId),
    };
    void answerTeamspaces(sync, request, { workspaceId, afterwards });
    return;
  }
  if (request.kind !== "switch" && request.kind !== "create") {
    void answerPeople(sync, request, workspaceId)
      .then(() => afterAnswer(request.kind, stepsOf(link, sync, workspaceId)))
      .catch(() => undefined);
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
    held: [],
    resync: () => {
      leave(link);
      if (link.sync !== undefined) void join(link, link.sync);
    },
  };
  return {
    onTransaction(transaction, state) {
      track(link, transaction, state);
    },
    start(given) {
      const sync: Sync = {
        send: (input, init) => fetch(input, init),
        openEvents: (url) => new EventSource(url),
        outbox: {
          load: () => Promise.resolve(undefined),
          save: () => Promise.resolve(),
        },
        ...given,
      };
      link.sync = sync;
      follow(link, sync);
      followPage(link, sync);
    },
  };
}
