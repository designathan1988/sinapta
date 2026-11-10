import { describe, expect, it } from "vitest";
import { applyOperations } from "./apply-operation.ts";
import type { Operation } from "./operation.ts";
import { buildWorkspace, toBlockId } from "./workspace-builder.ts";
import { findInvariantViolation } from "./workspace-invariants.ts";

const A = toBlockId("a");
const B = toBlockId("b");
const C = toBlockId("c");

function violationAfter(operations: Operation[]) {
  const before = buildWorkspace([
    { id: "a", children: [{ id: "b", children: [{ id: "c" }] }] },
  ]);
  const result = applyOperations(before, operations);
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return findInvariantViolation(
    before,
    result.workspace,
    result.changed.blockIds,
  );
}

describe("findInvariantViolation", () => {
  it("accepts a move that updates the parent pointer and both lists", () => {
    const violation = violationAfter([
      { type: "list.remove", list: { kind: "childIds", blockId: B }, id: C },
      {
        type: "list.insert",
        list: { kind: "childIds", blockId: A },
        id: C,
        index: 0,
      },
      { type: "record.update", kind: "block", id: C, patch: { parentId: A } },
    ]);

    expect(violation).toBeUndefined();
  });

  it("rejects a parent pointer that disagrees with the child list", () => {
    const violation = violationAfter([
      { type: "record.update", kind: "block", id: C, patch: { parentId: A } },
    ]);

    expect(violation).toEqual({ kind: "parent-mismatch", blockId: C });
  });

  it("rejects a child list that names a block twice", () => {
    const violation = violationAfter([
      {
        type: "list.insert",
        list: { kind: "childIds", blockId: B },
        id: C,
        index: 0,
      },
    ]);

    expect(violation).toEqual({ kind: "duplicate-child", blockId: B });
  });

  it("rejects a cycle", () => {
    const violation = violationAfter([
      { type: "list.remove", list: { kind: "rootIds" }, id: A },
      {
        type: "list.insert",
        list: { kind: "childIds", blockId: C },
        id: A,
        index: 0,
      },
      { type: "record.update", kind: "block", id: A, patch: { parentId: C } },
    ]);

    expect(violation).toMatchObject({ kind: "cycle" });
  });

  it("rejects deleting a block that a parent still lists", () => {
    const violation = violationAfter([
      { type: "record.delete", kind: "block", id: C },
    ]);

    expect(violation).toEqual({ kind: "dangling-child", blockId: B });
  });

  it("rejects deleting a block that still has children", () => {
    const violation = violationAfter([
      { type: "list.remove", list: { kind: "childIds", blockId: A }, id: B },
      { type: "record.delete", kind: "block", id: B },
    ]);

    expect(violation).toEqual({ kind: "orphan", blockId: C });
  });

  it("rejects a top-level block that the root list does not name", () => {
    const violation = violationAfter([
      { type: "list.remove", list: { kind: "rootIds" }, id: A },
    ]);

    expect(violation).toEqual({ kind: "parent-mismatch", blockId: A });
  });

  it("rejects a root list that names a block that does not exist", () => {
    const ghost = toBlockId("ghost");

    const violation = violationAfter([
      { type: "list.insert", list: { kind: "rootIds" }, id: ghost, index: 0 },
    ]);

    expect(violation).toEqual({ kind: "dangling-child", blockId: ghost });
  });
});
