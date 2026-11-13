import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  toBlockId,
  type Operation,
} from "../../model/index.ts";
import { lockGuard } from "./page-lock.ts";

function pageProps(extra: Record<string, unknown> = {}) {
  return {
    title: [],
    icon: null,
    isFavorite: false,
    isTrashed: false,
    ...extra,
  };
}

// A locked page holding a paragraph, and a locked database holding a row.
const WORKSPACE = buildWorkspace([
  {
    id: "locked",
    props: pageProps({ isLocked: true }),
    children: [{ id: "text", type: "paragraph", props: { text: [] } }],
  },
  {
    id: "db",
    type: "database",
    props: {
      ...pageProps({ isLocked: true }),
      properties: [],
      viewIds: [],
      templateIds: [],
      defaultTemplateId: null,
    },
    children: [{ id: "row", props: pageProps() }],
  },
]);

const id = toBlockId;

function updateProps(blockId: string, change: Record<string, unknown>) {
  const block = WORKSPACE.blocks[id(blockId)];
  const props = { ...block?.props, ...change };
  return [
    { type: "record.update", kind: "block", id: id(blockId), patch: { props } },
  ] satisfies Operation[];
}

const refuses = (operations: readonly Operation[]): boolean =>
  lockGuard(WORKSPACE, operations);

describe("a locked page", () => {
  it("keeps its title and its blocks as they are", () => {
    expect(refuses(updateProps("locked", { title: [{ text: "New" }] }))).toBe(
      true,
    );
    expect(refuses(updateProps("text", { text: [{ text: "typed" }] }))).toBe(
      true,
    );
    expect(
      refuses([
        {
          type: "list.insert",
          list: { kind: "childIds", blockId: id("locked") },
          id: id("x"),
          index: 0,
        },
      ]),
    ).toBe(true);
  });

  it("can still be unlocked, favorited and trashed", () => {
    expect(refuses(updateProps("locked", { isLocked: false }))).toBe(false);
    expect(refuses(updateProps("locked", { isFavorite: true }))).toBe(false);
    expect(refuses(updateProps("locked", { isTrashed: true }))).toBe(false);
  });

  it("can be deleted with everything in it", () => {
    expect(
      refuses([
        { type: "list.remove", list: { kind: "rootIds" }, id: id("locked") },
        { type: "record.delete", kind: "block", id: id("locked") },
        { type: "record.delete", kind: "block", id: id("text") },
      ]),
    ).toBe(false);
  });
});

describe("a locked database", () => {
  it("keeps its properties but lets its rows change", () => {
    expect(refuses(updateProps("db", { properties: [], viewIds: ["v"] }))).toBe(
      true,
    );
    expect(refuses(updateProps("row", { values: { p: "x" } }))).toBe(false);
  });
});

// A page in the trash, holding a paragraph.
const TRASHED = buildWorkspace([
  {
    id: "gone",
    props: pageProps({ isTrashed: true }),
    children: [{ id: "note", type: "paragraph", props: { text: [] } }],
  },
]);

function update(blockId: string, change: Record<string, unknown>) {
  const block = TRASHED.blocks[id(blockId)];
  const props = { ...block?.props, ...change };
  return [
    { type: "record.update", kind: "block", id: id(blockId), patch: { props } },
  ] satisfies Operation[];
}

describe("a page in the trash, as Notion's", () => {
  it("keeps its title and its blocks as they are", () => {
    expect(
      lockGuard(TRASHED, update("gone", { title: [{ text: "New" }] })),
    ).toBe(true);
    expect(
      lockGuard(TRASHED, update("note", { text: [{ text: "typed" }] })),
    ).toBe(true);
  });

  it("can still be restored", () => {
    expect(lockGuard(TRASHED, update("gone", { isTrashed: false }))).toBe(
      false,
    );
  });
});

describe("a page in the trash", () => {
  const trashed = buildWorkspace([
    {
      id: "bin",
      props: pageProps({ isTrashed: true, trashedAt: "2026-11-13T10:00" }),
    },
  ]);
  const restore = (): Operation[] => {
    const block = trashed.blocks[id("bin")];
    const { trashedAt: _when, ...kept } = block?.props ?? {};
    const props = { ...kept, isTrashed: false };
    return [
      { type: "record.update", kind: "block", id: id("bin"), patch: { props } },
    ];
  };

  it("is restored, its trash date going with it", () => {
    expect(lockGuard(trashed, restore())).toBe(false);
  });
});
