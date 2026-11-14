import { describe, expect, it } from "vitest";
import {
  applyOperations,
  buildWorkspace,
  parseBlockId,
  type BlockId,
  type Operation,
  type Workspace,
} from "../model/index.ts";
import { rebase, type Pending } from "./sync-rebase.ts";

function blockX(): BlockId {
  const id = parseBlockId("x");
  if (id === undefined) throw new Error("not an id");
  return id;
}
const X = blockX();

function titled(text: string): Workspace {
  return buildWorkspace([{ id: "x", props: { title: [{ text }] } }]);
}

function retitle(workspace: Workspace, text: string): Operation {
  const block = workspace.blocks[X];
  if (block === undefined) throw new Error("no block x");
  const { id, ...patch } = block;
  return {
    type: "record.update",
    kind: "block",
    id: X,
    patch: { ...patch, props: { title: [{ text }] } },
  };
}

function titleOf(workspace: Workspace): unknown {
  return workspace.blocks[X]?.props.title;
}

describe("rebase", () => {
  it("puts this client's unconfirmed change after the others'", () => {
    const start = titled("A");
    const mine = retitle(start, "mine");
    const local = applyOperations(start, [mine]);
    if (!local.ok) throw new Error("local change failed");
    const pending: Pending[] = [{ operations: [mine], inverse: local.inverse }];

    const result = rebase(local.workspace, pending, [retitle(start, "theirs")]);
    const applied =
      result && applyOperations(local.workspace, result.operations);
    if (!applied?.ok) throw new Error("rebase failed");
    const takenBack = applyOperations(
      applied.workspace,
      result?.pending[0]?.inverse ?? [],
    );

    expect(titleOf(applied.workspace)).toEqual([{ text: "mine" }]);
    expect(takenBack.ok && titleOf(takenBack.workspace)).toEqual([
      { text: "theirs" },
    ]);
  });

  it("answers nothing when the others' operations do not apply", () => {
    const missing: Operation = { type: "record.delete", kind: "block", id: X };

    const result = rebase(buildWorkspace([]), [], [missing]);

    expect(result).toBeUndefined();
  });
});
