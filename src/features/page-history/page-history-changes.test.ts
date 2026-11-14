import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId, type Block } from "../../model/index.ts";
import type { PageVersion } from "../../state/index.ts";
import {
  selectVersionAuthor,
  selectVersionChanges,
} from "./page-history.selectors.ts";

function version(id: string, texts: Readonly<Record<string, string>>) {
  const workspace = buildWorkspace([
    {
      id: "page",
      props: { title: [], icon: null, isFavorite: false, isTrashed: false },
      children: Object.entries(texts).map(([blockId, text]) => ({
        id: blockId,
        type: "paragraph",
        props: { text: [{ text }] },
      })),
    },
  ]);
  const blocks: Block[] = ["page", ...Object.keys(texts)].flatMap(
    (blockId) => workspace.blocks[toBlockId(blockId)] ?? [],
  );
  const taken: PageVersion = { id, takenAt: "2026-11-10T12:00:00Z", blocks };
  return taken;
}

describe("a version's changes", () => {
  it("mark the words it wrote and the blocks it added", () => {
    const newest = version("2", { a: "Ship the plan today", b: "New" });
    const older = version("1", { a: "Ship the plan" });

    const changes = selectVersionChanges([newest, older], 0);

    expect(changes.get(toBlockId("a"))).toEqual({
      kind: "text",
      start: 13,
      end: 19,
    });
    expect(changes.get(toBlockId("b"))).toEqual({ kind: "new" });
  });

  it("mark nothing in the oldest version, nor a text only shortened", () => {
    const newest = version("2", { a: "Ship" });
    const older = version("1", { a: "Ship the plan" });

    expect(selectVersionChanges([newest, older], 1).size).toBe(0);
    expect(selectVersionChanges([newest, older], 0).size).toBe(0);
  });
});

describe("selectVersionAuthor", () => {
  it("names the one who last changed a block of the version", () => {
    const taken = version("1", { a: "One", b: "Two" });
    const editors = [
      { at: "2026-11-10T10:00:00.000Z", by: { id: "u1", name: "Ada" } },
      { at: "2026-11-10T11:00:00.000Z", by: { id: "u2", name: "Grace" } },
    ];
    const blocks = taken.blocks.map((block, index) => {
      const editor = editors[index - 1];
      return editor === undefined
        ? block
        : { ...block, updatedAt: editor.at, editedBy: editor.by };
    });

    expect(selectVersionAuthor({ ...taken, blocks })).toBe("Grace");
    expect(selectVersionAuthor(taken)).toBeUndefined();
  });
});
