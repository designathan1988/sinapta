// Page versions on the server while a server workspace is open, so that
// every member, on any device, reads one history, as Notion's; a
// workspace kept only in this browser keeps its versions here.
import type { BlockId } from "../model/index.ts";
import type { Fetch } from "./account-client.ts";
import { readVersions } from "./snapshot.schema.ts";
import type { SnapshotStorage } from "./snapshot-store.ts";
import { getJson } from "./sync-session.ts";

function serverSnapshots(send: Fetch, workspaceId: string): SnapshotStorage {
  const path = (pageId: BlockId) =>
    `/api/workspaces/${workspaceId}/pages/${pageId}/versions`;
  return {
    async listSnapshots(pageId) {
      try {
        const versions = readVersions(await getJson(send, path(pageId)));
        return (versions ?? []).map((version) => ({ ...version, pageId }));
      } catch {
        return [];
      }
    },
    async putSnapshot({ id, pageId, takenAt, blocks }) {
      try {
        await getJson(send, path(pageId), { id, takenAt, blocks });
      } catch {
        // A version missed while offline is not kept, as one missed
        // between two runs of edits is not.
      }
    },
    // The server keeps each page's newest versions itself.
    deleteSnapshots: () => Promise.resolve(),
  };
}

// The server's versions while a server workspace is open, else these.
export function chooseSnapshots(
  local: SnapshotStorage,
  workspaceIdOf: () => string | null,
  send: Fetch = (input, init) => fetch(input, init),
): SnapshotStorage {
  const current = (): SnapshotStorage => {
    const workspaceId = workspaceIdOf();
    return workspaceId === null ? local : serverSnapshots(send, workspaceId);
  };
  return {
    listSnapshots: (pageId) => current().listSnapshots(pageId),
    putSnapshot: (snapshot) => current().putSnapshot(snapshot),
    deleteSnapshots: (ids) => current().deleteSnapshots(ids),
  };
}
