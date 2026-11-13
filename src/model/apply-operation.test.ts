import { describe, expect, it } from "vitest";
import { applyOperations } from "./apply-operation.ts";
import type { Block } from "./block.schema.ts";
import type { Operation } from "./operation.ts";
import { buildWorkspace, TEST_TIME, toBlockId } from "./workspace-builder.ts";

const A = toBlockId("a");
const B = toBlockId("b");
const C = toBlockId("c");

function createBlock(id: string, parentId: string | null): Block {
  return {
    id: toBlockId(id),
    type: "page",
    parentId: parentId === null ? null : toBlockId(parentId),
    childIds: [],
    props: {},
    createdAt: TEST_TIME,
    updatedAt: TEST_TIME,
  };
}

function apply(
  workspace: ReturnType<typeof buildWorkspace>,
  operations: Operation[],
) {
  const result = applyOperations(workspace, operations);
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result;
}

describe("applyOperations", () => {
  it("creates a record", () => {
    const workspace = buildWorkspace([{ id: "a" }]);

    const { workspace: next } = apply(workspace, [
      { type: "record.create", kind: "block", record: createBlock("b", null) },
      { type: "list.insert", list: { kind: "rootIds" }, id: B, index: 1 },
    ]);

    expect(next.rootIds).toEqual([A, B]);
    expect(next.blocks[B]?.type).toBe("page");
  });

  it("updates the patched fields of a record and keeps the rest", () => {
    const workspace = buildWorkspace([{ id: "a", props: { title: "Old" } }]);

    const { workspace: next } = apply(workspace, [
      {
        type: "record.update",
        kind: "block",
        id: A,
        patch: { props: { title: "New" } },
      },
    ]);

    expect(next.blocks[A]?.props).toEqual({ title: "New" });
    expect(next.blocks[A]?.createdAt).toBe(TEST_TIME);
  });

  it("deletes a record", () => {
    const workspace = buildWorkspace([{ id: "a" }, { id: "b" }]);

    const { workspace: next } = apply(workspace, [
      { type: "list.remove", list: { kind: "rootIds" }, id: B },
      { type: "record.delete", kind: "block", id: B },
    ]);

    expect(next.blocks[B]).toBeUndefined();
    expect(next.rootIds).toEqual([A]);
  });

  it("inserts into a child list at an index", () => {
    const workspace = buildWorkspace([{ id: "a", children: [{ id: "b" }] }]);

    const { workspace: next } = apply(workspace, [
      { type: "record.create", kind: "block", record: createBlock("c", "a") },
      {
        type: "list.insert",
        list: { kind: "childIds", blockId: A },
        id: C,
        index: 0,
      },
    ]);

    expect(next.blocks[A]?.childIds).toEqual([C, B]);
  });

  it("updates settings", () => {
    const { workspace: next } = apply(buildWorkspace([]), [
      { type: "record.update", kind: "settings", patch: { theme: "dark" } },
    ]);

    expect(next.settings.theme).toBe("dark");
  });

  it("returns an inverse that restores the previous workspace", () => {
    const workspace = buildWorkspace([{ id: "a", children: [{ id: "b" }] }]);
    const operations: Operation[] = [
      { type: "list.remove", list: { kind: "childIds", blockId: A }, id: B },
      {
        type: "record.update",
        kind: "block",
        id: B,
        patch: { parentId: null },
      },
      { type: "list.insert", list: { kind: "rootIds" }, id: B, index: 0 },
      { type: "record.update", kind: "settings", patch: { theme: "light" } },
    ];

    const forward = apply(workspace, operations);
    const backward = apply(forward.workspace, [...forward.inverse]);

    expect(backward.workspace).toEqual(workspace);
  });

  it("removes again on undo a field the update added", () => {
    const workspace = buildWorkspace([{ id: "a" }]);
    const forward = apply(workspace, [
      { type: "record.update", kind: "block", id: A, patch: { type: "x" } },
      {
        type: "record.update",
        kind: "settings",
        patch: { viewTabStyle: "icon" },
      },
    ]);

    const backward = apply(forward.workspace, [...forward.inverse]);

    expect("viewTabStyle" in backward.workspace.settings).toBe(false);
    expect(backward.workspace).toStrictEqual(workspace);
  });

  it("does not mutate the workspace it is given", () => {
    const workspace = buildWorkspace([{ id: "a" }]);
    const before = structuredClone(workspace);

    apply(workspace, [
      { type: "record.update", kind: "block", id: A, patch: { type: "quote" } },
    ]);

    expect(workspace).toEqual(before);
  });

  it("lists the records and lists that changed", () => {
    const workspace = buildWorkspace([{ id: "a" }, { id: "b" }]);

    const { changed } = apply(workspace, [
      { type: "record.update", kind: "block", id: A, patch: { type: "quote" } },
      { type: "list.remove", list: { kind: "rootIds" }, id: B },
      { type: "record.delete", kind: "block", id: B },
    ]);

    expect([...changed.blockIds]).toEqual([A, B]);
    expect(changed.hasMetaChange).toBe(true);
  });

  it.each<[string, Operation, string]>([
    [
      "an update",
      { type: "record.update", kind: "block", id: C, patch: {} },
      "missing-record",
    ],
    [
      "a delete",
      { type: "record.delete", kind: "block", id: C },
      "missing-record",
    ],
    [
      "a create",
      { type: "record.create", kind: "block", record: createBlock("a", null) },
      "duplicate-record",
    ],
    [
      "a list removal",
      { type: "list.remove", list: { kind: "rootIds" }, id: C },
      "missing-list-item",
    ],
    [
      "a list insert",
      { type: "list.insert", list: { kind: "rootIds" }, id: C, index: 9 },
      "index-out-of-range",
    ],
  ])("returns a typed error for %s that cannot apply", (_, operation, kind) => {
    const workspace = buildWorkspace([{ id: "a" }]);

    const result = applyOperations(workspace, [operation]);

    expect(result).toMatchObject({ ok: false, error: { kind } });
  });
});
