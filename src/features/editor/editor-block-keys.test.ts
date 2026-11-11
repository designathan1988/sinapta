import { describe, expect, it } from "vitest";
import { toBlockId } from "../../model/index.ts";
import type { AppState, Command, Dispatch } from "../../state/index.ts";
import { createApp, text } from "./editor-builder.ts";
import {
  blockKeyAction,
  runBlockKeyAction,
  type BlockKeyStroke,
} from "./editor-block-keys.view.ts";

const A = toBlockId("a");

function stroke(overrides: Partial<BlockKeyStroke>): BlockKeyStroke {
  return {
    key: "",
    code: "",
    ctrlKey: false,
    metaKey: false,
    shiftKey: false,
    altKey: false,
    isComposing: false,
    ...overrides,
  };
}

const ctrl = { ctrlKey: true };
const ctrlShift = { ctrlKey: true, shiftKey: true };

describe("blockKeyAction", () => {
  it.each([
    ["Escape", stroke({ key: "Escape" }), { kind: "select-block" }],
    ["Ctrl+A", stroke({ key: "a", ...ctrl }), { kind: "select-all" }],
    ["Ctrl+D", stroke({ key: "d", ...ctrl }), { kind: "duplicate" }],
    [
      "Ctrl+Shift+ArrowUp",
      stroke({ key: "ArrowUp", ...ctrlShift }),
      { kind: "move", offset: -1 },
    ],
    [
      "Ctrl+Shift+ArrowDown",
      stroke({ key: "ArrowDown", ...ctrlShift }),
      { kind: "move", offset: 1 },
    ],
    ["Ctrl+Enter", stroke({ key: "Enter", ...ctrl }), { kind: "activate" }],
    [
      "Ctrl+Alt+T",
      stroke({ key: "t", code: "KeyT", ctrlKey: true, altKey: true }),
      { kind: "toggle-all" },
    ],
    [
      "Ctrl+Shift+H",
      stroke({ key: "H", ...ctrlShift }),
      { kind: "last-color" },
    ],
    [
      "Ctrl+Shift+1",
      stroke({ key: "!", code: "Digit1", ...ctrlShift }),
      { kind: "turn-into", blockType: "heading", extraProps: { level: 1 } },
    ],
    [
      "Ctrl+Shift+0",
      stroke({ key: ")", code: "Digit0", ...ctrlShift }),
      { kind: "turn-into", blockType: "paragraph" },
    ],
    [
      "Ctrl+Shift+8",
      stroke({ key: "*", code: "Digit8", ...ctrlShift }),
      { kind: "turn-into", blockType: "code" },
    ],
  ])("maps %s", (_, keyStroke, action) => {
    expect(blockKeyAction(keyStroke)).toEqual(action);
  });

  it("leaves other keys to the editor", () => {
    expect(blockKeyAction(stroke({ key: "a" }))).toBeUndefined();
    expect(
      blockKeyAction(stroke({ key: "d", ctrlKey: true, altKey: true })),
    ).toBeUndefined();
  });
});

// Runs an action on block "a" and returns what it sent.
function run(
  state: AppState,
  action: Parameters<typeof runBlockKeyAction>[0],
): Command[] {
  const sent: Command[] = [];
  const dispatch: Dispatch = (command) => {
    sent.push(command);
    return { ok: true };
  };
  runBlockKeyAction(
    action,
    { blockId: A, start: 0, end: 2 },
    { state, dispatch },
  );
  return sent;
}

describe("runBlockKeyAction", () => {
  it("duplicates the block with everything inside it", () => {
    const { store } = createApp([text("a", "one"), text("b", "two")]);

    expect(run(store.getState(), { kind: "duplicate" })).toEqual([
      expect.objectContaining({
        type: "block.duplicate",
        blockId: "a",
        blockCount: 1,
      }),
    ]);
  });

  it("selects every block of the page", () => {
    const { store } = createApp([text("a", "one"), text("b", "two")]);

    expect(run(store.getState(), { kind: "select-all" })).toEqual([
      expect.objectContaining({
        type: "ui.selectBlockRange",
        anchorId: "a",
        focusId: "b",
      }),
    ]);
  });

  it("checks a to-do when it is activated", () => {
    const { store } = createApp([text("a", "task", "to-do")]);

    expect(run(store.getState(), { kind: "activate" })).toEqual([
      expect.objectContaining({ type: "toDo.toggle", blockId: "a" }),
    ]);
  });

  it("opens every toggle of the page when one is closed", () => {
    const toggle = {
      id: "a",
      type: "toggle",
      props: { text: [], isOpen: false },
    };
    const { store } = createApp([toggle]);

    expect(run(store.getState(), { kind: "toggle-all" })).toEqual([
      expect.objectContaining({ type: "toggle.setAllOpen", isOpen: true }),
    ]);
  });

  it("turns the block into another type", () => {
    const { store } = createApp([text("a", "title")]);
    const action = {
      kind: "turn-into",
      blockType: "heading",
      extraProps: { level: 2 },
    } as const;

    expect(run(store.getState(), action)).toEqual([
      expect.objectContaining({
        type: "block.convert",
        blockId: "a",
        blockType: "heading",
        extraProps: { level: 2 },
      }),
    ]);
  });

  it("applies the last color used to the selected text", () => {
    const { store } = createApp([text("a", "hello")]);
    const state = store.getState();
    const lastTone = { key: "color", tone: "red" } as const;
    const withTone = { ...state, ui: { ...state.ui, lastTone } };

    expect(run(withTone, { kind: "last-color" })).toEqual([
      expect.objectContaining({
        type: "text.setTone",
        blockId: "a",
        key: "color",
        tone: "red",
      }),
    ]);
  });
});
