import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  listOf,
  toBlockId,
  type BlockSpec,
} from "../../model/index.ts";
import { createTestApp, defineCommand } from "../../state/index.ts";
import { columnCommands, resizeColumns } from "../column/index.ts";
import {
  columnListCommands,
  dropBeside,
  moveToNewColumn,
} from "./column-list.commands.ts";
import { tidyColumns } from "./column-list-tidy.ts";

const PAGE = toBlockId("page");
const id = toBlockId;

function text(name: string): BlockSpec {
  return { id: name, type: "paragraph", props: { text: [{ text: name }] } };
}

function column(name: string, ratio: number, children: BlockSpec[]) {
  return { id: name, type: "column", props: { ratio }, children };
}

// Moves a block to the end of the page, as any move out of a column does.
const moveToPageEnd = defineCommand<{ blockId: string }>({
  type: "test.moveToPageEnd",
  handle(state, command) {
    const blockId = id(command.blockId);
    const block = state.workspace.blocks[blockId];
    const page = state.workspace.blocks[PAGE];
    if (block === undefined || page === undefined) return {};
    return {
      operations: [
        { type: "list.remove", list: listOf(block.parentId), id: blockId },
        {
          type: "list.insert",
          list: listOf(PAGE),
          id: blockId,
          index: page.childIds.length,
        },
        {
          type: "record.update",
          kind: "block",
          id: blockId,
          patch: { parentId: PAGE },
        },
      ],
    };
  },
});

function createApp(children: BlockSpec[]) {
  const workspace = buildWorkspace([{ id: "page", children }]);
  const app = createTestApp({
    workspace,
    commands: [...columnListCommands, ...columnCommands, moveToPageEnd],
    tidiers: [tidyColumns],
  });
  // The page as "type:name" lines, two spaces per level.
  const tree = (parentId = PAGE, depth = 0): string[] =>
    (app.store.getState().workspace.blocks[parentId]?.childIds ?? []).flatMap(
      (childId) => {
        const block = app.store.getState().workspace.blocks[childId];
        if (block === undefined) return [];
        const name = block.type === "paragraph" ? childId : block.type;
        return [`${"  ".repeat(depth)}${name}`, ...tree(childId, depth + 1)];
      },
    );
  const ratios = (listId: string): unknown[] =>
    (app.store.getState().workspace.blocks[id(listId)]?.childIds ?? []).map(
      (columnId) =>
        app.store.getState().workspace.blocks[columnId]?.props.ratio,
    );
  return { ...app, tree, ratios };
}

describe("columns.dropBeside", () => {
  it("puts a block dropped on the right of another in a column beside it", () => {
    const { dispatch, tree, ratios } = createApp([text("a"), text("b")]);

    dispatch(
      dropBeside.create({ blockId: id("b"), targetId: id("a"), side: "right" }),
    );

    expect(tree()).toEqual([
      "column-list",
      "  column",
      "    a",
      "  column",
      "    b",
    ]);
    expect(ratios("new-1")).toEqual([0.5, 0.5]);
  });

  it("adds a column to a list a block is dropped beside", () => {
    const { dispatch, tree, ratios } = createApp([
      {
        id: "list",
        type: "column-list",
        props: {},
        children: [
          column("c1", 0.5, [text("a")]),
          column("c2", 0.5, [text("b")]),
        ],
      },
      text("d"),
    ]);

    dispatch(
      dropBeside.create({ blockId: id("d"), targetId: id("b"), side: "left" }),
    );

    expect(tree()).toEqual([
      "column-list",
      "  column",
      "    a",
      "  column",
      "    d",
      "  column",
      "    b",
    ]);
    const shares = ratios("list").map(Number);
    expect(shares.reduce((sum, share) => sum + share, 0)).toBeCloseTo(1);
    expect(shares[1]).toBeCloseTo(1 / 3);
  });

  it("is undone in one step", () => {
    const { store, dispatch } = createApp([text("a"), text("b")]);
    const before = store.getState().workspace;
    dispatch(
      dropBeside.create({ blockId: id("b"), targetId: id("a"), side: "left" }),
    );

    dispatch({ type: "history.undo" });

    expect(store.getState().workspace).toEqual(before);
  });
});

describe("tidying columns", () => {
  const twoColumns = [
    {
      id: "list",
      type: "column-list",
      props: {},
      children: [
        column("c1", 0.4, [text("a"), text("a2")]),
        column("c2", 0.3, [text("b")]),
        column("c3", 0.3, [text("c")]),
      ],
    },
  ];

  it("removes a column left empty and shares its width out", () => {
    const { dispatch, tree, ratios } = createApp(twoColumns);

    dispatch(moveToPageEnd.create({ blockId: "c" }));

    expect(tree()).toEqual([
      "column-list",
      "  column",
      "    a",
      "    a2",
      "  column",
      "    b",
      "c",
    ]);
    const shares = ratios("list").map(Number);
    expect(shares[0]).toBeCloseTo(0.4 / 0.7);
    expect(shares.reduce((sum, share) => sum + share, 0)).toBeCloseTo(1);
  });

  it("unwraps a list left with one column", () => {
    const { dispatch, tree } = createApp(twoColumns);

    dispatch(moveToPageEnd.create({ blockId: "c" }));
    dispatch(moveToPageEnd.create({ blockId: "b" }));

    expect(tree()).toEqual(["a", "a2", "c", "b"]);
  });
});

describe("columns.resize", () => {
  it("moves the boundary between two columns and keeps the sum at 1", () => {
    const { dispatch, ratios } = createApp([
      {
        id: "list",
        type: "column-list",
        props: {},
        children: [
          column("c1", 0.5, [text("a")]),
          column("c2", 0.5, [text("b")]),
        ],
      },
    ]);

    dispatch(
      resizeColumns.create({ blockId: id("list"), index: 0, share: 0.7 }),
    );
    expect(ratios("list")).toEqual([0.7, expect.closeTo(0.3)]);
    dispatch(
      resizeColumns.create({ blockId: id("list"), index: 0, share: 0.99 }),
    );
    expect(ratios("list")).toEqual([0.9, expect.closeTo(0.1)]);
  });
});

describe("columns.moveToNewColumn", () => {
  it("puts the block in a column beside the block before it", () => {
    const { dispatch, tree } = createApp([text("a"), text("b")]);

    dispatch(moveToNewColumn.create({ blockId: id("b") }));

    expect(tree()).toEqual([
      "column-list",
      "  column",
      "    a",
      "  column",
      "    b",
    ]);
  });
});
