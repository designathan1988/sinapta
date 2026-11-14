import { describe, expect, it } from "vitest";
import { applyOperations } from "./apply-operation.ts";
import { parseWireOperations } from "./operation.schema.ts";
import { buildWorkspace, toBlockId } from "./workspace-builder.ts";

const PAGE = toBlockId("page");

describe("an update from the wire", () => {
  it("clears an optional field the whole record no longer has", () => {
    const workspace = buildWorkspace([{ id: "page" }]);
    const page = workspace.blocks[PAGE];
    if (page === undefined) throw new Error("setup");
    const edited = { ...page, editedBy: { id: "u1", name: "Ada" } };
    const before = applyOperations(workspace, [
      { type: "record.update", kind: "block", id: PAGE, patch: edited },
    ]);
    if (!before.ok) throw new Error("setup");
    const { id: _id, ...whole } = page;

    const operations = parseWireOperations(
      JSON.parse(
        JSON.stringify([
          { type: "record.update", kind: "block", id: "page", patch: whole },
        ]),
      ),
    );
    const after = applyOperations(before.workspace, operations ?? []);

    expect(before.workspace.blocks[PAGE]?.editedBy).toEqual({
      id: "u1",
      name: "Ada",
    });
    expect(after.ok && after.workspace.blocks[PAGE]).not.toHaveProperty(
      "editedBy",
    );
  });
});
