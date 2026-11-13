import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  toBlockId,
  type BlockSpec,
} from "../../model/index.ts";
import { createInitialState, type AppState } from "../../state/index.ts";
import {
  selectClosedHolders,
  selectPageOutline,
} from "./page-outline.selectors.ts";

function heading(
  id: string,
  level: number,
  children: BlockSpec[] = [],
): BlockSpec {
  return {
    id,
    type: "heading",
    props: {
      level,
      text: [{ text: id }],
      isToggleable: children.length > 0,
      isOpen: false,
    },
    children,
  };
}

function stateOf(children: BlockSpec[]): AppState {
  const workspace = buildWorkspace([{ id: "page", children }]);
  return { ...createInitialState(), workspace };
}

const PAGE = toBlockId("page");

describe("selectPageOutline", () => {
  it("shows nothing for a page with two headings", () => {
    const state = stateOf([heading("A", 2), heading("B", 3)]);

    expect(selectPageOutline(state, PAGE)).toEqual([]);
  });

  it("gives a dash per heading from three, longer for higher levels", () => {
    const state = stateOf([
      heading("A", 2),
      heading("B", 3),
      heading("C", 4),
      heading("D", 2),
    ]);

    expect(
      selectPageOutline(state, PAGE).map((entry) => [entry.text, entry.dash]),
    ).toEqual([
      ["A", "long"],
      ["B", "mid"],
      ["C", "short"],
      ["D", "long"],
    ]);
  });
});

describe("selectClosedHolders", () => {
  it("lists the closed toggles holding a heading, outermost first", () => {
    const inner: BlockSpec = {
      id: "toggle",
      type: "toggle",
      props: { text: [{ text: "More" }], isOpen: false },
      children: [heading("deep", 3)],
    };
    const state = stateOf([heading("outer", 2, [inner])]);

    expect(selectClosedHolders(state, toBlockId("deep"))).toEqual([
      { blockId: toBlockId("outer"), isHeading: true },
      { blockId: toBlockId("toggle"), isHeading: false },
    ]);
  });
});
