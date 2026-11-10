import { describe, expect, it } from "vitest";
import { applyOperations } from "./apply-operation.ts";
import { dropMove, planMove, type BlockMove } from "./block-tree.ts";
import { buildWorkspace, toBlockId } from "./workspace-builder.ts";
import { findInvariantViolation } from "./workspace-invariants.ts";

const A = toBlockId("a");
const A1 = toBlockId("a1");
const A2 = toBlockId("a2");
const B = toBlockId("b");

function createWorkspace() {
  return buildWorkspace([
    { id: "a", children: [{ id: "a1" }, { id: "a2" }] },
    { id: "b" },
  ]);
}

function moved(move: BlockMove) {
  const before = createWorkspace();
  const result = applyOperations(before, planMove(before, move));
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  const violation = findInvariantViolation(
    before,
    result.workspace,
    result.changed.blockIds,
  );
  if (violation !== undefined) throw new Error(JSON.stringify(violation));
  return result.workspace;
}

describe("planMove", () => {
  it("reorders a block among its siblings", () => {
    const workspace = moved({ blockId: A2, parentId: A, index: 0 });

    expect(workspace.blocks[A]?.childIds).toEqual([A2, A1]);
  });

  it("moves a block to another parent and keeps both lists consistent", () => {
    const workspace = moved({ blockId: A1, parentId: B, index: 0 });

    expect(workspace.blocks[B]?.childIds).toEqual([A1]);
    expect(workspace.blocks[A]?.childIds).toEqual([A2]);
    expect(workspace.blocks[A1]?.parentId).toBe(B);
  });

  it("moves a block to the top level", () => {
    expect(moved({ blockId: A1, parentId: null, index: 1 }).rootIds).toEqual([
      A,
      A1,
      B,
    ]);
  });

  it("clamps an index beyond the end", () => {
    expect(moved({ blockId: A, parentId: null, index: 99 }).rootIds).toEqual([
      B,
      A,
    ]);
  });

  it.each<[string, BlockMove]>([
    ["into itself", { blockId: A, parentId: A, index: 0 }],
    ["into its own descendant", { blockId: A, parentId: A1, index: 0 }],
    ["to where it already is", { blockId: A1, parentId: A, index: 0 }],
    [
      "into a parent that does not exist",
      { blockId: A1, parentId: toBlockId("ghost"), index: 0 },
    ],
  ])("plans nothing for a move %s", (_, move) => {
    expect(planMove(createWorkspace(), move)).toEqual([]);
  });
});

describe("dropMove", () => {
  it.each([
    { position: "before", blockId: B, targetId: A, parentId: null, index: 0 },
    { position: "after", blockId: A1, targetId: B, parentId: null, index: 2 },
    { position: "inside", blockId: B, targetId: A, parentId: A, index: 2 },
    { position: "after", blockId: A1, targetId: A2, parentId: A, index: 1 },
  ] as const)("drops a block $position another", (row) => {
    const { blockId, targetId, position, parentId, index } = row;

    const move = dropMove(createWorkspace(), blockId, { targetId, position });

    expect(move).toEqual({ blockId, parentId, index });
  });

  it("has no move when a block is dropped on itself", () => {
    const drop = { targetId: A, position: "inside" } as const;

    expect(dropMove(createWorkspace(), A, drop)).toBeUndefined();
  });
});
