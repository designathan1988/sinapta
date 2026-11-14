import { describe, expect, it } from "vitest";
import { stampAuthor } from "./author-stamp.ts";
import { buildWorkspace } from "./workspace-builder.ts";
import type { Operation } from "./operation.ts";

const ADA = { id: "u1", name: "Ada" };

describe("stampAuthor", () => {
  it("stamps who made a new block and who changed one, and nothing else", () => {
    const workspace = buildWorkspace([{ id: "p1" }]);
    const block = Object.values(workspace.blocks)[0];
    if (block === undefined) throw new Error("no block");
    const operations: Operation[] = [
      { type: "record.create", kind: "block", record: block },
      {
        type: "record.update",
        kind: "block",
        id: block.id,
        patch: { props: {} },
      },
      { type: "record.update", kind: "settings", patch: { theme: "dark" } },
    ];

    const [created, updated, settings] = stampAuthor(operations, ADA);

    expect(created).toMatchObject({
      record: { createdBy: ADA, editedBy: ADA },
    });
    expect(updated).toMatchObject({ patch: { props: {}, editedBy: ADA } });
    expect(settings).toEqual(operations[2]);
  });
});
