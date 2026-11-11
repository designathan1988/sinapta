import { describe, expect, it } from "vitest";
import { copyBlockTree, countBlockTree } from "./block-copy.ts";
import { buildWorkspace, TEST_TIME, toBlockId } from "./workspace-builder.ts";

const workspace = buildWorkspace([
  {
    id: "page",
    children: [
      {
        id: "a",
        type: "paragraph",
        props: { text: [{ text: "A" }] },
        children: [{ id: "a1", type: "paragraph", props: { text: [] } }],
      },
    ],
  },
]);
const A = toBlockId("a");
const NEW = [toBlockId("n1"), toBlockId("n2")];
const LATER = "2026-11-11T09:00:00.000Z";

describe("countBlockTree", () => {
  it("counts a block and everything inside it", () => {
    expect(countBlockTree(workspace, A)).toBe(2);
  });

  it("counts nothing for a missing block", () => {
    expect(countBlockTree(workspace, toBlockId("missing"))).toBe(0);
  });
});

describe("copyBlockTree", () => {
  it("copies a block and its children with new ids, in tree order", () => {
    const copies = copyBlockTree(workspace, {
      rootId: A,
      ids: NEW,
      now: LATER,
    });

    expect(copies).toEqual([
      {
        id: "n1",
        type: "paragraph",
        parentId: "page",
        childIds: ["n2"],
        props: { text: [{ text: "A" }] },
        createdAt: LATER,
        updatedAt: LATER,
      },
      {
        id: "n2",
        type: "paragraph",
        parentId: "n1",
        childIds: [],
        props: { text: [] },
        createdAt: LATER,
        updatedAt: LATER,
      },
    ]);
  });

  it("copies nothing when there are too few new ids", () => {
    const copies = copyBlockTree(workspace, {
      rootId: A,
      ids: NEW.slice(0, 1),
      now: TEST_TIME,
    });

    expect(copies).toBeUndefined();
  });
});
