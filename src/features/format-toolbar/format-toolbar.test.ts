import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId, type RichText } from "../../model/index.ts";
import {
  createInitialState,
  type AppState,
  type OpenOverlay,
} from "../../state/index.ts";
import {
  selectFormatRange,
  selectRangeStyle,
  TONE_OVERLAY,
} from "./format-toolbar.selectors.ts";

const A = toBlockId("a");

interface Setup {
  readonly text?: RichText;
  readonly type?: string;
  readonly anchor: number;
  readonly focus: number;
  readonly overlay?: OpenOverlay;
}

function stateWith(setup: Setup): AppState {
  const text = setup.text ?? [{ text: "Hello world" }];
  const workspace = buildWorkspace([
    {
      id: "page",
      children: [{ id: "a", type: setup.type ?? "paragraph", props: { text } }],
    },
  ]);
  const initial = createInitialState();
  const selection = {
    blockId: A,
    anchorOffset: setup.anchor,
    focusOffset: setup.focus,
  };
  const overlay = setup.overlay ?? null;
  return { ...initial, workspace, ui: { ...initial.ui, selection, overlay } };
}

describe("selectFormatRange", () => {
  it("returns the selected range in reading order", () => {
    expect(selectFormatRange(stateWith({ anchor: 5, focus: 0 }))).toEqual({
      blockId: A,
      start: 0,
      end: 5,
    });
  });

  it("returns nothing for a caret with no range", () => {
    expect(
      selectFormatRange(stateWith({ anchor: 3, focus: 3 })),
    ).toBeUndefined();
  });

  it("returns nothing inside a code block", () => {
    const state = stateWith({ anchor: 0, focus: 5, type: "code" });

    expect(selectFormatRange(state)).toBeUndefined();
  });

  it("hides behind another overlay but stays while the color picker is open", () => {
    const menu = stateWith({ anchor: 0, focus: 5, overlay: { kind: "link" } });
    const picker = stateWith({
      anchor: 0,
      focus: 5,
      overlay: { kind: TONE_OVERLAY },
    });

    expect(selectFormatRange(menu)).toBeUndefined();
    expect(selectFormatRange(picker)).toBeDefined();
  });
});

describe("selectRangeStyle", () => {
  const text: RichText = [
    { text: "He", marks: ["bold", "italic"], color: "red" },
    { text: "llo", marks: ["bold"], color: "red", highlight: "yellow" },
  ];

  it("lists the marks the whole range has", () => {
    const state = stateWith({ text, anchor: 0, focus: 5 });

    expect(selectRangeStyle(state, { blockId: A, start: 0, end: 5 })).toEqual({
      marks: ["bold"],
      color: "red",
      highlight: undefined,
      hasLink: false,
    });
  });

  it("reports a highlight shared by the whole range", () => {
    const state = stateWith({ text, anchor: 2, focus: 5 });

    expect(
      selectRangeStyle(state, { blockId: A, start: 2, end: 5 }),
    ).toMatchObject({
      highlight: "yellow",
    });
  });
});
