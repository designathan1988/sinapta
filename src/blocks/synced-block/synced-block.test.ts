import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  listOf,
  toBlockId,
  type BlockSpec,
} from "../../model/index.ts";
import { createTestApp, defineCommand } from "../../state/index.ts";
import { isTextBlock, textOf } from "../text-block.ts";
import {
  selectShownChildren,
  syncedBlockCommands,
  unsyncBlock,
} from "./synced-block.commands.ts";
import { tidySyncedBlocks } from "./synced-block-tidy.ts";

const ORIGINAL = toBlockId("s");
const REFERENCE = toBlockId("r");
const CHILD = toBlockId("c");

function text(id: string, value: string): BlockSpec {
  return { id, type: "paragraph", props: { text: [{ text: value }] } };
}

// Deletes a block and everything inside it, as the editor does.
const removeBlock = defineCommand<{ blockId: string }>({
  type: "test.remove",
  handle(state, command) {
    const id = toBlockId(command.blockId);
    const block = state.workspace.blocks[id];
    if (block === undefined) return {};
    const subtree = (blockId: typeof id): (typeof id)[] => [
      blockId,
      ...(state.workspace.blocks[blockId]?.childIds ?? []).flatMap(subtree),
    ];
    return {
      operations: [
        { type: "list.remove", list: listOf(block.parentId), id },
        ...subtree(id).map((each) => ({
          type: "record.delete" as const,
          kind: "block" as const,
          id: each,
        })),
      ],
    };
  },
});

// Changes the text of a block, as typing does.
const retype = defineCommand<{ blockId: string; text: string }>({
  type: "test.retype",
  handle(state, command) {
    const id = toBlockId(command.blockId);
    const block = state.workspace.blocks[id];
    if (block === undefined) return {};
    const props = { ...block.props, text: [{ text: command.text }] };
    return {
      operations: [
        { type: "record.update", kind: "block", id, patch: { props } },
      ],
    };
  },
});

function createApp() {
  const workspace = buildWorkspace([
    {
      id: "page",
      children: [
        {
          id: "s",
          type: "synced-block",
          props: {},
          children: [text("c", "Shared")],
        },
      ],
    },
    {
      id: "other",
      children: [{ id: "r", type: "synced-block", props: { sourceId: "s" } }],
    },
  ]);
  const app = createTestApp({
    workspace,
    commands: [...syncedBlockCommands, removeBlock, retype],
    tidiers: [tidySyncedBlocks],
  });
  const textsUnder = (blockId: typeof REFERENCE): string[] =>
    selectShownChildren(app.store.getState(), blockId).map((child) =>
      isTextBlock(child) ? textOf(child) : "",
    );
  return { ...app, textsUnder };
}

describe("synced blocks", () => {
  it("show the original's blocks in a reference, so an edit shows in both", () => {
    const { dispatch, textsUnder } = createApp();

    dispatch(retype.create({ blockId: "c", text: "Changed" }));

    expect(textsUnder(ORIGINAL)).toEqual(["Changed"]);
    expect(textsUnder(REFERENCE)).toEqual(["Changed"]);
  });

  it("keep their content when a reference is unsynced", () => {
    const { store, dispatch, textsUnder } = createApp();

    dispatch(unsyncBlock.create({ blockId: REFERENCE, blockCount: 1 }));
    dispatch(retype.create({ blockId: "c", text: "Changed" }));

    expect(
      store.getState().workspace.blocks[REFERENCE]?.props.sourceId,
    ).toBeUndefined();
    expect(textsUnder(REFERENCE)).toEqual(["Shared"]);
  });

  it("keep the references' content when the original is deleted", () => {
    const { store, dispatch, textsUnder } = createApp();

    dispatch(removeBlock.create({ blockId: "s" }));

    expect(store.getState().workspace.blocks[CHILD]).toBeUndefined();
    expect(
      store.getState().workspace.blocks[REFERENCE]?.props.sourceId,
    ).toBeUndefined();
    expect(textsUnder(REFERENCE)).toEqual(["Shared"]);
  });

  it("undo the deletion of an original with its references in one step", () => {
    const { store, dispatch } = createApp();
    const before = store.getState().workspace;
    dispatch(removeBlock.create({ blockId: "s" }));

    dispatch({ type: "history.undo" });

    expect(store.getState().workspace).toEqual(before);
  });
});
