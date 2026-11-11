import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  toBlockId,
  type BlockSpec,
} from "../../model/index.ts";
import { createInitialState } from "../../state/index.ts";
import { selectListMarker } from "./numbered-list.selectors.ts";

function item(id: string, children: BlockSpec[] = []): BlockSpec {
  return { id, type: "numbered-list", props: { text: [] }, children };
}

function markerOf(blocks: BlockSpec[], id: string): string {
  const workspace = buildWorkspace([{ id: "page", children: blocks }]);
  const state = { ...createInitialState(), workspace };
  return selectListMarker(state, toBlockId(id));
}

describe("selectListMarker", () => {
  it("counts items that follow each other", () => {
    expect(markerOf([item("a"), item("b"), item("c")], "c")).toBe("3.");
  });

  it("starts again after a block of another kind", () => {
    const paragraph = { id: "p", type: "paragraph", props: { text: [] } };

    expect(markerOf([item("a"), paragraph, item("b")], "b")).toBe("1.");
  });

  it("uses letters at the second level and roman numerals at the third", () => {
    const blocks = [
      item("a", [item("b1"), item("b2", [item("c1"), item("c2")])]),
    ];

    expect(markerOf(blocks, "b2")).toBe("b.");
    expect(markerOf(blocks, "c2")).toBe("ii.");
  });

  it("goes back to numbers at the fourth level", () => {
    const blocks = [item("a", [item("b", [item("c", [item("d")])])])];

    expect(markerOf(blocks, "d")).toBe("1.");
  });

  it("writes large positions in letters and roman numerals", () => {
    const many = Array.from({ length: 28 }, (_, i) => item(`b${String(i)}`));
    const deep = Array.from({ length: 14 }, (_, i) => item(`c${String(i)}`));
    const blocks = [item("a", [...many, item("z", deep)])];

    expect(markerOf(blocks, "b27")).toBe("ab.");
    expect(markerOf(blocks, "c13")).toBe("xiv.");
  });
});
