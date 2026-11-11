import * as v from "valibot";
import { describe, expect, it } from "vitest";
import type { BlockProps } from "./block.schema.ts";
import { createEmptyWorkspace } from "./workspace.ts";
import { parseWorkspaceFile, type PropsSchemas } from "./workspace.schema.ts";

const PROPS_SCHEMAS: PropsSchemas = new Map<
  string,
  v.GenericSchema<unknown, BlockProps>
>([
  ["page", v.object({ title: v.array(v.object({ text: v.string() })) })],
  ["to-do", v.object({ isChecked: v.boolean() })],
]);

function createBlockJson(overrides: Record<string, unknown> = {}) {
  return {
    id: "b-01",
    type: "page",
    parentId: null,
    childIds: [],
    props: { title: [{ text: "Roadmap" }] },
    createdAt: "2026-11-10T12:00:00Z",
    updatedAt: "2026-11-10T12:00:00Z",
    ...overrides,
  };
}

function createFileJson(blocks: Record<string, unknown>) {
  return {
    schemaVersion: 1,
    rootIds: ["b-01"],
    blocks,
    views: {},
    settings: { theme: "system" },
  };
}

function parse(json: unknown) {
  const result = parseWorkspaceFile(json, PROPS_SCHEMAS);
  if (!result.ok) throw new Error(JSON.stringify(result.error));
  return result;
}

describe("parseWorkspaceFile", () => {
  it("parses a file with a page and a child block", () => {
    const child = createBlockJson({
      id: "b-02",
      type: "to-do",
      parentId: "b-01",
      props: { isChecked: false },
    });
    const page = createBlockJson({ childIds: ["b-02"] });

    const { workspace, skipped } = parse(
      createFileJson({ "b-01": page, "b-02": child }),
    );

    expect(skipped).toEqual([]);
    expect(Object.keys(workspace.blocks)).toEqual(["b-01", "b-02"]);
    expect(workspace.rootIds).toEqual(["b-01"]);
    expect(workspace.settings.theme).toBe("system");
  });

  it("skips and reports a record that fails its schema", () => {
    const broken = createBlockJson({ id: "b-02", childIds: "none" });

    const { workspace, skipped } = parse(
      createFileJson({ "b-01": createBlockJson(), "b-02": broken }),
    );

    expect(Object.keys(workspace.blocks)).toEqual(["b-01"]);
    expect(skipped).toEqual([
      { kind: "invalid-record", recordId: "b-02", path: "childIds" },
    ]);
  });

  it("keeps a block whose reader drops broken parts and counts each part", () => {
    const schemas: PropsSchemas = new Map([
      ...PROPS_SCHEMAS,
      [
        "list",
        (json: unknown) => ({
          ok: true as const,
          props: { items: ["kept"] },
          dropped: [`items.1 of ${JSON.stringify(json)}`],
        }),
      ],
    ]);
    const block = createBlockJson({ type: "list", props: { items: [] } });

    const result = parseWorkspaceFile(
      createFileJson({ "b-01": block }),
      schemas,
    );

    expect(result).toMatchObject({
      ok: true,
      workspace: { blocks: { "b-01": { props: { items: ["kept"] } } } },
      skipped: [
        {
          kind: "invalid-record",
          recordId: "b-01",
          path: 'props.items.1 of {"items":[]}',
        },
      ],
    });
  });

  it("skips a block whose reader refuses its props", () => {
    const schemas: PropsSchemas = new Map([
      ["page", () => ({ ok: false as const, path: "title" })],
    ]);

    const result = parseWorkspaceFile(
      createFileJson({ "b-01": createBlockJson() }),
      schemas,
    );

    expect(result).toMatchObject({
      skipped: [
        { kind: "invalid-record", recordId: "b-01", path: "props.title" },
      ],
    });
  });

  it("skips a block whose props do not fit its type", () => {
    const block = createBlockJson({ props: { title: "plain" } });

    const { skipped } = parse(createFileJson({ "b-01": block }));

    expect(skipped).toEqual([
      { kind: "invalid-record", recordId: "b-01", path: "props.title" },
    ]);
  });

  it("skips a block of an unknown type", () => {
    const block = createBlockJson({ type: "hologram" });

    const { skipped } = parse(createFileJson({ "b-01": block }));

    expect(skipped).toEqual([
      { kind: "unknown-type", recordId: "b-01", type: "hologram" },
    ]);
  });

  it("skips a record stored under a key that is not its id", () => {
    const { skipped } = parse(createFileJson({ other: createBlockJson() }));

    expect(skipped).toEqual([
      { kind: "invalid-record", recordId: "other", path: "id" },
    ]);
  });

  it("drops keys it does not know", () => {
    const block = createBlockJson({ futureKey: true });

    const { workspace } = parse(createFileJson({ "b-01": block }));

    expect(Object.values(workspace.blocks)[0]).not.toHaveProperty("futureKey");
  });

  it("rejects a file with an unknown theme", () => {
    const json = { ...createFileJson({}), settings: { theme: "sepia" } };

    expect(parseWorkspaceFile(json, PROPS_SCHEMAS)).toEqual({
      ok: false,
      error: { kind: "invalid-file", path: "settings.theme" },
    });
  });

  it("rejects a value that is not a workspace file", () => {
    expect(parseWorkspaceFile("nonsense", PROPS_SCHEMAS)).toMatchObject({
      ok: false,
      error: { kind: "invalid-file" },
    });
  });
});

describe("createEmptyWorkspace", () => {
  it("has no records and follows the system theme", () => {
    expect(createEmptyWorkspace()).toEqual({
      blocks: {},
      views: {},
      rootIds: [],
      settings: { theme: "system" },
    });
  });
});
