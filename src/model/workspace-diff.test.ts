import { describe, expect, it } from "vitest";
import { applyOperations } from "./apply-operation.ts";
import { buildWorkspace, toBlockId } from "./workspace-builder.ts";
import { diffWorkspace } from "./workspace-diff.ts";

const A = toBlockId("a");
const B = toBlockId("b");

describe("diffWorkspace", () => {
  it("reports nothing for the same workspace", () => {
    const workspace = buildWorkspace([{ id: "a" }]);

    expect(diffWorkspace(workspace, workspace)).toEqual({
      blockIds: new Set(),
      viewIds: new Set(),
      hasMetaChange: false,
    });
  });

  it("reports updated and deleted blocks and a changed root list", () => {
    const before = buildWorkspace([{ id: "a" }, { id: "b" }]);
    const result = applyOperations(before, [
      { type: "record.update", kind: "block", id: A, patch: { type: "quote" } },
      { type: "list.remove", list: { kind: "rootIds" }, id: B },
      { type: "record.delete", kind: "block", id: B },
    ]);
    if (!result.ok) throw new Error("setup failed");

    const changed = diffWorkspace(before, result.workspace);

    expect(changed.blockIds).toEqual(new Set([A, B]));
    expect(changed.hasMetaChange).toBe(true);
  });

  it("reports a settings change as a meta change", () => {
    const before = buildWorkspace([]);
    const after = { ...before, settings: { theme: "dark" as const } };

    expect(diffWorkspace(before, after).hasMetaChange).toBe(true);
  });
});
