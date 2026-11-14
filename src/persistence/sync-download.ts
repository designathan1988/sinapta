// Joining a workspace on the server (ADR-0013): its snapshot and the
// operations logged since, read, with this browser's unconfirmed changes
// made again on it before it replaces the browser's copy; then the
// session is ready and sends them.
import { loadServerWorkspace } from "../state/index.ts";
import { takeOutbox, withLogged, withUnsent } from "./sync-outbox.ts";
import {
  flush,
  getJson,
  keepOutbox,
  ready,
  startPending,
  takeHeld,
  type Link,
  type Session,
  type Sync,
} from "./sync-session.ts";
import * as reply from "./sync.schema.ts";
import { readWorkspaceFile } from "./workspace-file.ts";

export async function download(link: Link, sync: Sync, session: Session) {
  const path = `/api/workspaces/${session.id}`;
  const loaded = reply.readDownload(await getJson(sync.send, path));
  if (loaded === undefined) return;
  const text = JSON.stringify(loaded.snapshot);
  const file = readWorkspaceFile(text, sync.propsSchemas);
  if (!file.ok) return;
  // The workspace as it stands now, built before it is shown, so that the
  // open page, made after the snapshot, is there when it is; and with this
  // browser's unconfirmed changes on it, typing done meanwhile included,
  // so that nothing on screen goes back.
  const now = withLogged(file.workspace, loaded.operations);
  const outbox = await takeOutbox(sync, session.id);
  const unsent = withUnsent(now.workspace, [...outbox, ...takeHeld(link)]);
  sync.dispatch(
    loadServerWorkspace.create({
      workspace: unsent.workspace,
      ...(loaded.access !== undefined && { access: loaded.access }),
    }),
  );
  startPending(session, unsent.pending);
  ready(link, session, now.seq ?? loaded.seq);
  keepOutbox(link, session);
  flush(link, session);
}
