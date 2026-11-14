// @vitest-environment happy-dom
import { describe, expect, it } from "vitest";
import {
  BLOCK_CLIPBOARD_TYPE,
  parseBlockClipboard,
  toBlockId,
} from "../../model/index.ts";
import type { AppState, Command, Dispatch } from "../../state/index.ts";
import { createApp, text } from "./editor-builder.ts";
import { selectBlockRange } from "./editor-selection.commands.ts";
import { copyBlocksByKey, onSelectionCopy } from "./editor-clipboard.view.ts";
import { onSelectionKeyDown } from "./editor-selection.view.ts";

function selectedState(): AppState {
  const { store, dispatch } = createApp([text("a", "one"), text("b", "two")]);
  dispatch(
    selectBlockRange.create({
      anchorId: toBlockId("a"),
      focusId: toBlockId("b"),
    }),
  );
  return store.getState();
}

function press(init: KeyboardEventInit): Command[] {
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  const event = new KeyboardEvent("keydown", { cancelable: true, ...init });
  onSelectionKeyDown(event, { state: selectedState(), dispatch });
  return sent;
}

describe("keys on selected blocks", () => {
  it("moves the selected blocks with Ctrl+Shift and an arrow", () => {
    const sent = press({ key: "ArrowDown", ctrlKey: true, shiftKey: true });

    expect(sent).toEqual([
      expect.objectContaining({ type: "block.moveSelectedBy", offset: 1 }),
    ]);
  });

  it("duplicates each selected block with Ctrl+D", () => {
    const sent = press({ key: "d", ctrlKey: true });

    expect(sent.map((command) => command.type)).toEqual([
      "block.duplicate",
      "block.duplicate",
    ]);
  });
});

describe("copying selected blocks", () => {
  it("puts their kinds and nesting on the clipboard", () => {
    const state = selectedState();
    const clipboardData = new DataTransfer();
    const event = new ClipboardEvent("copy", {
      clipboardData,
      cancelable: true,
    });
    const dispatch: Dispatch = () => ({ ok: true });

    onSelectionCopy(event, { state, dispatch });

    const copied = parseBlockClipboard(
      clipboardData.getData(BLOCK_CLIPBOARD_TYPE),
    );
    expect(copied?.map((block) => [block.kind, block.depth])).toEqual([
      ["paragraph", 0],
      ["paragraph", 0],
    ]);
    expect(clipboardData.getData("text/plain")).toBe("one\ntwo");
  });

  it("puts them as HTML too, for other apps, as Notion's", () => {
    const clipboardData = new DataTransfer();
    const event = new ClipboardEvent("copy", {
      clipboardData,
      cancelable: true,
    });
    const dispatch: Dispatch = () => ({ ok: true });

    onSelectionCopy(event, { state: selectedState(), dispatch });

    expect(clipboardData.getData("text/html")).toBe("<p>one</p><p>two</p>");
  });
});

describe("Ctrl+C on selected blocks", () => {
  it("keeps the copied blocks and their text for a paste", () => {
    const sent = press({ key: "c", ctrlKey: true });

    expect(sent).toEqual([
      expect.objectContaining({
        type: "ui.setClipboard",
        clipboard: {
          text: "one\ntwo",
          blocks: [
            { kind: "paragraph", depth: 0, text: [{ text: "one" }] },
            { kind: "paragraph", depth: 0, text: [{ text: "two" }] },
          ],
        },
      }),
    ]);
  });

  it("keeps a code block's language", () => {
    const { store, dispatch } = createApp([
      { id: "c", type: "code", props: { text: [], language: "rust" } },
    ]);
    const c = toBlockId("c");
    dispatch(selectBlockRange.create({ anchorId: c, focusId: c }));
    const sent: Command[] = [];
    const event = new KeyboardEvent("keydown", { key: "c", ctrlKey: true });

    copyBlocksByKey(event, {
      state: store.getState(),
      dispatch: (command) => {
        sent.push(command);
        return { ok: true };
      },
    });

    expect(sent[0]).toMatchObject({
      clipboard: { blocks: [{ kind: "code", language: "rust" }] },
    });
  });

  it("keeps a table's cells", () => {
    const rows = [[[{ text: "x" }]]];
    const props = { rows, hasHeaderRow: true, hasHeaderColumn: false };
    const { store, dispatch } = createApp([
      { id: "t", type: "simple-table", props },
    ]);
    const t = toBlockId("t");
    dispatch(selectBlockRange.create({ anchorId: t, focusId: t }));
    const sent: Command[] = [];
    const event = new KeyboardEvent("keydown", { key: "c", ctrlKey: true });

    copyBlocksByKey(event, {
      state: store.getState(),
      dispatch: (command) => {
        sent.push(command);
        return { ok: true };
      },
    });

    expect(sent[0]).toMatchObject({
      clipboard: {
        blocks: [{ kind: "simple-table", rows, hasHeaderRow: true }],
      },
    });
  });

  it("also deletes them with Ctrl+X", () => {
    const types = press({ key: "x", ctrlKey: true }).map((c) => c.type);

    expect(types).toEqual(["ui.setClipboard", "block.deleteSelected"]);
  });
});
