import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  buildWorkspace,
  toBlockId,
  TEST_PROPS_SCHEMAS,
} from "../model/index.ts";
import {
  addTestBlock,
  createTestApp,
  loadWorkspace,
  persistenceCommands,
  setSidebarWidth,
  setTheme,
  uiCommands,
} from "../state/index.ts";
import {
  createMemoryAdapter,
  type StorageAdapter,
  type StoredData,
} from "./storage-adapter.ts";
import { SAVE_DEBOUNCE_MS, startRepository } from "./workspace-repository.ts";

const COMMANDS = [
  addTestBlock,
  setTheme,
  loadWorkspace,
  ...uiCommands,
  ...persistenceCommands,
];

async function start(adapter: StorageAdapter) {
  const app = createTestApp({ commands: COMMANDS });
  await startRepository({ ...app, adapter, propsSchemas: TEST_PROPS_SCHEMAS });
  return app;
}

function storedPage(id: string, ui: unknown = null): StoredData {
  const workspace = buildWorkspace([{ id }]);
  return { file: { schemaVersion: 1, ...workspace }, ui };
}

const addPage = addTestBlock.create({ blockType: "page" });

describe("workspace repository", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("saves the records a transaction changed after the debounce", async () => {
    const adapter = createMemoryAdapter();
    const { dispatch } = await start(adapter);

    dispatch(addPage);
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

    expect(adapter.saves).toHaveLength(1);
    expect(adapter.saves[0]?.putBlocks.map((block) => block.id)).toEqual([
      "new-1",
    ]);
    expect(adapter.saves[0]?.meta?.rootIds).toEqual(["new-1"]);
  });

  it("does not save before the debounce has passed", async () => {
    const adapter = createMemoryAdapter();
    const { dispatch } = await start(adapter);

    dispatch(addPage);
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS - 1);

    expect(adapter.saves).toHaveLength(0);
  });

  it("merges changes made within the window into one save", async () => {
    const adapter = createMemoryAdapter();
    const { dispatch } = await start(adapter);

    dispatch(addPage);
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS - 1);
    dispatch(addPage);
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

    expect(adapter.saves).toHaveLength(1);
    expect(adapter.saves[0]?.putBlocks).toHaveLength(2);
  });

  it("saves the interface state without touching records", async () => {
    const adapter = createMemoryAdapter();
    const { dispatch } = await start(adapter);

    dispatch(setSidebarWidth.create({ width: 20 }));
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

    expect(adapter.saves[0]).toMatchObject({
      putBlocks: [],
      ui: { sidebarWidth: 20 },
    });
    expect(adapter.saves[0]?.meta).toBeUndefined();
  });

  it("saves settings in the workspace meta", async () => {
    const adapter = createMemoryAdapter();
    const { dispatch } = await start(adapter);

    dispatch(setTheme.create({ theme: "dark" }));
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

    expect(adapter.saves[0]?.meta?.settings).toEqual({ theme: "dark" });
  });

  it("reports saved after a save", async () => {
    const { store, dispatch } = await start(createMemoryAdapter());

    dispatch(addPage);
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

    expect(store.getState().persistence.status).toBe("saved");
  });

  it("reports a failed save and retries the same records next time", async () => {
    const adapter = createMemoryAdapter();
    const save = vi
      .spyOn(adapter, "save")
      .mockRejectedValueOnce(new Error("full"));
    const { store, dispatch } = await start(adapter);

    dispatch(addPage);
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);
    expect(store.getState().persistence.status).toBe("failed");
    dispatch(setSidebarWidth.create({ width: 20 }));
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

    expect(save).toHaveBeenCalledTimes(2);
    expect(adapter.saves[0]?.putBlocks.map((block) => block.id)).toEqual([
      "new-1",
    ]);
  });

  it("loads a stored workspace and interface state without saving it back", async () => {
    const ui = {
      activePageId: "a",
      sidebarWidth: 22,
      isSidebarCollapsed: true,
    };
    const adapter = createMemoryAdapter(storedPage("a", ui));

    const { store } = await start(adapter);
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

    expect(store.getState().workspace.rootIds).toEqual([toBlockId("a")]);
    expect(store.getState().ui.sidebarWidth).toBe(22);
    expect(adapter.saves).toHaveLength(0);
  });

  it("skips a stored record that fails its schema and counts it", async () => {
    const file = {
      schemaVersion: 1,
      rootIds: [],
      blocks: { a: { id: "a" } },
      views: {},
      settings: { theme: "system" },
    };

    const { store } = await start(createMemoryAdapter({ file, ui: null }));

    expect(store.getState().workspace.blocks).toEqual({});
    expect(store.getState().persistence.skippedCount).toBe(1);
  });

  it("starts with an empty workspace when nothing is stored", async () => {
    const { store } = await start(createMemoryAdapter());

    expect(store.getState().workspace.rootIds).toEqual([]);
  });

  it("reports a failed status when storage cannot be read", async () => {
    const adapter = createMemoryAdapter();
    vi.spyOn(adapter, "load").mockRejectedValue(new Error("blocked"));

    const { store } = await start(adapter);

    expect(store.getState().persistence.status).toBe("failed");
  });

  it("does not save over stored data that it could not read", async () => {
    const newer = { file: { schemaVersion: 99 }, ui: null };
    const adapter = createMemoryAdapter(newer);
    const { store, dispatch } = await start(adapter);

    dispatch(addPage);
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

    expect(adapter.saves).toHaveLength(0);
    expect(store.getState().persistence.status).toBe("failed");
  });
});
