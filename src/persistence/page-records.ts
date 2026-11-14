// What is kept of each page beside the workspace: its versions, for its
// history, and each opening of it, for its analytics; on the server while
// a server workspace is open, else in this browser.
import type { AppStore, Dispatch } from "../state/index.ts";
import {
  createIndexedDbPageViews,
  createIndexedDbSnapshots,
} from "./indexed-db-adapter.ts";
import { choosePageViews, startPageViews } from "./page-views.ts";
import { chooseSnapshots } from "./server-snapshots.ts";
import { startSnapshots, type SnapshotOptions } from "./snapshot-store.ts";

export function startPageRecords(options: {
  readonly store: AppStore;
  readonly dispatch: Dispatch;
  readonly contentOf: SnapshotOptions["contentOf"];
}): void {
  const { store, dispatch, contentOf } = options;
  const workspaceIdOf = () => store.getState().persistence.sync.workspaceId;
  startSnapshots({
    store,
    dispatch,
    storage: chooseSnapshots(createIndexedDbSnapshots(), workspaceIdOf),
    contentOf,
  });
  startPageViews({
    store,
    dispatch,
    storage: choosePageViews(createIndexedDbPageViews(), workspaceIdOf),
  });
}
