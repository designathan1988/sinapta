import { describe, expect, it } from "vitest";
import { toBlockId, type Block } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { replaceText } from "./editor.commands.ts";
import { createApp, PAGE, text } from "./editor-builder.ts";
import { selectBlockDrawKey } from "./editor-redraw.selectors.ts";

const A = toBlockId("a");
const B = toBlockId("b");

function blockOf(state: AppState, id = A): Block {
  const block = state.workspace.blocks[id];
  if (block === undefined) throw new Error(`no block ${id}`);
  return block;
}

function keyOf(state: AppState, id = A, isSelected = false) {
  return selectBlockDrawKey(state, blockOf(state, id), isSelected);
}

function expectSameKey(
  before: readonly unknown[] | undefined,
  after: readonly unknown[] | undefined,
): void {
  expect(before).toBeDefined();
  expect(after?.length).toBe(before?.length);
  after?.forEach((value, index) => {
    expect(value).toBe(before?.[index]);
  });
}

function typeInto(app: ReturnType<typeof createApp>, id = B): void {
  app.dispatch(
    replaceText.create({ blockId: id, start: 0, end: 0, text: "x" }),
  );
}

describe("selectBlockDrawKey", () => {
  it("stays the same for a block when another block changes", () => {
    const app = createApp([text("a", "one"), text("b", "two")]);
    const before = keyOf(app.store.getState());

    typeInto(app);

    expectSameKey(before, keyOf(app.store.getState()));
  });

  it("changes when the block's own text changes", () => {
    const app = createApp([text("a", "one"), text("b", "two")]);
    const before = keyOf(app.store.getState());

    typeInto(app, A);

    expect(keyOf(app.store.getState())).not.toEqual(before);
  });

  it("changes when the block is selected", () => {
    const app = createApp([text("a", "one")]);
    const state = app.store.getState();

    expect(keyOf(state, A, true)).not.toEqual(keyOf(state, A, false));
  });

  it("changes when a menu opens beside the block", () => {
    const state = createApp([text("a", "one")]).store.getState();
    const overlay = { kind: "block-menu", anchorId: A };
    const withMenu = { ...state, ui: { ...state.ui, overlay } };

    expect(keyOf(withMenu)).not.toEqual(keyOf(state));
  });

  it("changes when a numbered item's number changes", () => {
    const app = createApp([
      text("x", "first", "numbered-list"),
      text("a", "second", "numbered-list"),
    ]);
    const state = app.store.getState();
    const first = blockOf(state, toBlockId("x"));
    const page = blockOf(state, PAGE);
    const reordered: AppState = {
      ...state,
      workspace: {
        ...state.workspace,
        blocks: {
          ...state.workspace.blocks,
          [PAGE]: { ...page, childIds: [A, first.id] },
        },
      },
    };

    expect(keyOf(reordered)).not.toEqual(keyOf(state));
  });

  it("is undefined for a block that shows its children", () => {
    const app = createApp([
      { ...text("a", "parent", "bulleted-list"), children: [text("c", "kid")] },
    ]);

    expect(keyOf(app.store.getState())).toBeUndefined();
  });

  it("is undefined for a block type that reads the whole workspace", () => {
    const app = createApp([
      { id: "a", type: "table-of-contents", props: {} },
      text("b", "two", "heading"),
    ]);

    expect(keyOf(app.store.getState())).toBeUndefined();
  });
});
