import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  listOf,
  toBlockId,
  type Operation,
} from "../model/index.ts";
import { defineCommand } from "./command-registry.ts";
import { createTestApp } from "./state-builder.ts";
import type { Tidier } from "./tidy.ts";

const BOX = toBlockId("box");
const ITEM = toBlockId("item");

// A container that may not stay empty: once its last child leaves, it goes.
const removeEmptyBoxes: Tidier = (workspace, changed) =>
  [...changed].flatMap((id): Operation[] => {
    const block = workspace.blocks[id];
    if (block?.type !== "box" || block.childIds.length > 0) return [];
    return [
      { type: "list.remove", list: listOf(block.parentId), id },
      { type: "record.delete", kind: "block", id },
    ];
  });

// Moves the item out of the box to the top level.
const takeOut = defineCommand<Record<string, never>>({
  type: "test.takeOut",
  handle: () => ({
    operations: [
      { type: "list.remove", list: listOf(BOX), id: ITEM },
      { type: "list.insert", list: listOf(null), id: ITEM, index: 0 },
      {
        type: "record.update",
        kind: "block",
        id: ITEM,
        patch: { parentId: null },
      },
    ],
  }),
});

function createApp() {
  const workspace = buildWorkspace([
    { id: "box", type: "box", children: [{ id: "item", type: "x" }] },
  ]);
  return createTestApp({
    workspace,
    commands: [takeOut],
    tidiers: [removeEmptyBoxes],
  });
}

describe("tidiers", () => {
  it("tidy the workspace after a command, in the same transaction", () => {
    const { store, dispatch } = createApp();

    dispatch(takeOut.create({}));

    const { workspace } = store.getState();
    expect(workspace.rootIds).toEqual([ITEM]);
    expect(workspace.blocks[BOX]).toBeUndefined();
  });

  it("are undone with the command in one step", () => {
    const { store, dispatch } = createApp();
    const before = store.getState().workspace;
    dispatch(takeOut.create({}));

    dispatch({ type: "history.undo" });

    expect(store.getState().workspace).toEqual(before);
  });
});
