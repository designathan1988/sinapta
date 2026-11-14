import { describe, expect, it } from "vitest";
import type { Operation } from "./operation.ts";
import { isCommentChange, mayChange } from "./page-access.ts";
import { buildWorkspace, toBlockId } from "./workspace-builder.ts";

const workspace = buildWorkspace([
  {
    id: "p",
    props: { title: [{ text: "Plan" }], text: [{ text: "Hello" }] },
  },
]);
const block = workspace.blocks[toBlockId("p")];

function update(props: Record<string, unknown>): Operation {
  return {
    type: "record.update",
    kind: "block",
    id: toBlockId("p"),
    patch: { props: { ...block?.props, ...props }, updatedAt: "later" },
  };
}

describe("isCommentChange", () => {
  it("accepts a new discussion and comment marks on the same words", () => {
    const marked = update({
      discussions: [{ id: "d" }],
      text: [{ text: "Hel", comments: ["d"] }, { text: "lo" }],
    });

    expect(isCommentChange(marked, block)).toBe(true);
  });

  it("refuses a change to the words or the title", () => {
    expect(isCommentChange(update({ text: [{ text: "Bye" }] }), block)).toBe(
      false,
    );
    expect(isCommentChange(update({ title: [{ text: "X" }] }), block)).toBe(
      false,
    );
  });
});

describe("mayChange", () => {
  it("lets editors change anything and commenters only comment", () => {
    expect(mayChange("edit", false)).toBe(true);
    expect(mayChange("comment", true)).toBe(true);
    expect(mayChange("comment", false)).toBe(false);
    expect(mayChange("view", true)).toBe(false);
    expect(mayChange(undefined, true)).toBe(false);
  });
});
