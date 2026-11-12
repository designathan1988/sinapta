import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId, type BlockId } from "../model/index.ts";
import {
  createTestApp,
  defineCommand,
  setActivePage,
  uiCommands,
} from "../state/index.ts";
import {
  createMemorySnapshots,
  overflowingSnapshots,
  startSnapshots,
  type StoredSnapshot,
} from "./snapshot-store.ts";

const MINUTE = 60 * 1000;
const DOC = toBlockId("doc");

// An edit to a page, as any text change is.
const touchPage = defineCommand<{ pageId: BlockId; title: string }>({
  type: "test.touchPage",
  handle(state, command) {
    const page = state.workspace.blocks[command.pageId];
    if (page === undefined) return {};
    const props = { ...page.props, title: [{ text: command.title }] };
    return {
      operations: [
        { type: "record.update", kind: "block", id: page.id, patch: { props } },
      ],
    };
  },
});

function setup() {
  const workspace = buildWorkspace([{ id: "doc" }]);
  const app = createTestApp({
    workspace,
    commands: [touchPage, ...uiCommands],
  });
  app.dispatch(setActivePage.create({ pageId: DOC }));
  let time = Date.parse("2026-11-11T09:00:00.000Z");
  const storage = createMemorySnapshots();
  startSnapshots({
    store: app.store,
    dispatch: app.dispatch,
    storage,
    now: () => new Date(time).toISOString(),
    contentOf: (current, pageId) => {
      const page = current.blocks[pageId];
      return page === undefined ? [] : [page];
    },
  });
  const edit = (minutesLater: number): void => {
    time += minutesLater * MINUTE;
    app.dispatch(touchPage.create({ pageId: DOC, title: String(time) }));
  };
  return { storage, edit };
}

describe("page versions", () => {
  it("are kept as the open page is edited, at most every 10 minutes", async () => {
    const { storage, edit } = setup();

    edit(1);
    edit(4);
    edit(11);
    await Promise.resolve();

    expect(await storage.listSnapshots(DOC)).toHaveLength(2);
  });

  it("keep the 50 newest of a page", () => {
    const snapshots: StoredSnapshot[] = Array.from({ length: 52 }, (_, n) => ({
      id: `s${String(n)}`,
      pageId: DOC,
      takenAt: new Date(Date.UTC(2026, 0, 1, 0, n)).toISOString(),
      blocks: [],
    }));

    expect(overflowingSnapshots(snapshots, 50)).toEqual(["s0", "s1"]);
  });
});
