import { describe, expect, it } from "vitest";
import { buildWorkspace, TEST_TIME, toBlockId } from "../../model/index.ts";
import { createInitialState, type AppState } from "../../state/index.ts";
import { selectEditedLabel, selectWordCount } from "./page-info.selectors.ts";

const PAGE = toBlockId("page");

function stateWith(texts: string[]): AppState {
  const workspace = buildWorkspace([
    {
      id: "page",
      children: [
        ...texts.map((text, index) => ({
          id: `t${String(index)}`,
          type: "paragraph",
          props: { text: [{ text }] },
        })),
        { id: "sub", children: [] },
      ],
    },
  ]);
  return { ...createInitialState(), workspace };
}

function later(seconds: number): string {
  return new Date(Date.parse(TEST_TIME) + seconds * 1000).toISOString();
}

describe("selectEditedLabel", () => {
  it.each([
    [0, "Edited just now"],
    [59, "Edited just now"],
    [5 * 60, "Edited 5m ago"],
    [3 * 3600, "Edited 3h ago"],
    [2 * 86_400, "Edited Nov 10"],
  ])("labels an edit %i seconds ago as %s", (seconds, label) => {
    expect(selectEditedLabel(stateWith(["a"]), PAGE, later(seconds))).toBe(
      label,
    );
  });
});

describe("selectWordCount", () => {
  it("counts words and whole characters of the page's text", () => {
    expect(selectWordCount(stateWith(["Hello, world 👋"]), PAGE)).toEqual({
      words: 2,
      characters: 14,
    });
  });

  it("adds up every block and leaves subpages out", () => {
    const state = stateWith(["one two", "three"]);

    expect(selectWordCount(state, PAGE).words).toBe(3);
  });
});
