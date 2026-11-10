import { describe, expect, it } from "vitest";
import {
  buildWorkspace,
  TEST_PROPS_SCHEMAS,
  toBlockId,
} from "../model/index.ts";
import {
  addTestBlock,
  createTestApp,
  persistenceCommands,
  requestExport,
  requestImport,
  uiCommands,
  workspaceCommands,
} from "../state/index.ts";
import {
  readWorkspaceFile,
  serializeWorkspace,
  startFileTools,
} from "./workspace-file.ts";

const WORKSPACE = buildWorkspace([
  { id: "a", props: { title: "Alpha" }, children: [{ id: "a1" }] },
  { id: "b" },
]);

function createApp() {
  const commands = [
    addTestBlock,
    ...persistenceCommands,
    ...workspaceCommands,
    ...uiCommands,
  ];
  const app = createTestApp({ commands });
  const saved: string[] = [];
  startFileTools({
    ...app,
    propsSchemas: TEST_PROPS_SCHEMAS,
    save: (text) => saved.push(text),
  });
  return { ...app, saved };
}

describe("serializeWorkspace and readWorkspaceFile", () => {
  it("reproduces the workspace exactly", () => {
    const result = readWorkspaceFile(
      serializeWorkspace(WORKSPACE),
      TEST_PROPS_SCHEMAS,
    );

    expect(result).toEqual({ ok: true, workspace: WORKSPACE, skipped: [] });
  });

  it("gives the same file whatever order the records are held in", () => {
    const reversed = Object.fromEntries(
      Object.entries(WORKSPACE.blocks).reverse(),
    );
    const shuffled = { ...WORKSPACE, blocks: reversed };

    expect(serializeWorkspace(shuffled)).toBe(serializeWorkspace(WORKSPACE));
  });

  it("writes the current schema version", () => {
    const file: unknown = JSON.parse(serializeWorkspace(WORKSPACE));

    expect(file).toMatchObject({ schemaVersion: 1, rootIds: ["a", "b"] });
  });

  it.each([
    ["text that is not JSON", "{ not json", "unreadable"],
    ["JSON that is not a workspace", '{"hello":"world"}', "not-a-workspace"],
    [
      "a file with a broken shape",
      '{"schemaVersion":1,"rootIds":"x"}',
      "not-a-workspace",
    ],
    ["a file from a newer version", '{"schemaVersion":99}', "newer-version"],
  ])("refuses %s", (_, text, error) => {
    expect(readWorkspaceFile(text, TEST_PROPS_SCHEMAS)).toEqual({
      ok: false,
      error,
    });
  });

  it("skips and counts a record it cannot read", () => {
    const file = {
      schemaVersion: 1,
      ...WORKSPACE,
      blocks: { ...WORKSPACE.blocks, x: { id: "x" } },
    };

    const result = readWorkspaceFile(JSON.stringify(file), TEST_PROPS_SCHEMAS);

    expect(result).toMatchObject({ ok: true, skipped: [{ recordId: "x" }] });
  });
});

describe("file tools", () => {
  it("writes the workspace when an export is requested", () => {
    const { dispatch, saved } = createApp();
    dispatch(addTestBlock.create({ blockType: "page" }));

    dispatch(requestExport.create({}));

    expect(saved).toHaveLength(1);
    expect(JSON.parse(saved[0] ?? "")).toMatchObject({ rootIds: ["new-1"] });
  });

  it("replaces the workspace with an imported file", async () => {
    const { store, dispatch } = createApp();
    dispatch(addTestBlock.create({ blockType: "page" }));

    dispatch(requestImport.create({ text: serializeWorkspace(WORKSPACE) }));
    await Promise.resolve();

    const state = store.getState();
    expect(state.workspace).toEqual(WORKSPACE);
    expect(state.workspace.blocks[toBlockId("new-1")]).toBeUndefined();
    expect(state.persistence).toMatchObject({
      pendingImport: null,
      importError: null,
    });
    expect(state.history.undo).toEqual([]);
  });

  it("keeps the workspace and reports why when the file cannot be imported", async () => {
    const { store, dispatch } = createApp();
    dispatch(addTestBlock.create({ blockType: "page" }));
    const before = store.getState().workspace;

    dispatch(requestImport.create({ text: "not a workspace" }));
    await Promise.resolve();

    expect(store.getState().workspace).toBe(before);
    expect(store.getState().persistence.importError).toBe("unreadable");
  });
});
