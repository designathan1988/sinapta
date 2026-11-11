import { describe, expect, it } from "vitest";
import { addTestBlock, createTestApp } from "./state-builder.ts";

describe("guards", () => {
  it("refuse a command they keep out, which changes nothing", () => {
    const { store, dispatch } = createTestApp({
      commands: [addTestBlock],
      guards: [() => true],
    });

    const result = dispatch(addTestBlock.create({ blockType: "paragraph" }));

    expect(result).toEqual({ ok: false, error: { kind: "locked" } });
    expect(store.getState().workspace.rootIds).toEqual([]);
  });

  it("let through what no guard keeps out", () => {
    const { store, dispatch } = createTestApp({
      commands: [addTestBlock],
      guards: [() => false],
    });

    dispatch(addTestBlock.create({ blockType: "paragraph" }));

    expect(store.getState().workspace.rootIds).toHaveLength(1);
  });
});
