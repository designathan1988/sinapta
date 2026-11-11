import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildWorkspace, TEST_PROPS_SCHEMAS } from "../model/index.ts";
import {
  addTestBlock,
  createTestApp,
  loadWorkspace,
  persistenceCommands,
  uiCommands,
  setSidebarWidth,
} from "../state/index.ts";
import type { StorageAdapter, StoredData } from "./storage-adapter.ts";
import type { TabCoordination, TabRole } from "./tab-lock.ts";
import { SAVE_DEBOUNCE_MS, startRepository } from "./workspace-repository.ts";

const COMMANDS = [
  addTestBlock,
  loadWorkspace,
  ...uiCommands,
  ...persistenceCommands,
];

function storedPages(...ids: string[]): StoredData {
  const workspace = buildWorkspace(ids.map((id) => ({ id })));
  return { file: { schemaVersion: 1, ...workspace }, ui: null };
}

// Storage another tab can write to, and the record of what this tab wrote.
function sharedStorage(initial: StoredData) {
  const storage = { stored: initial, saves: 0 };
  const adapter: StorageAdapter = {
    load: () => Promise.resolve(storage.stored),
    save() {
      storage.saves += 1;
      return Promise.resolve();
    },
    loadAssets: () => Promise.resolve([]),
    putAssets: () => Promise.resolve(),
  };
  return { storage, adapter };
}

// Tab coordination driven by the test: the role, the moment the writer
// lock frees, and the other tab's save messages.
function fakeTabs(role: TabRole) {
  const listeners: (() => void)[] = [];
  let free = (): void => undefined;
  const announced = { count: 0 };
  const tabs: TabCoordination = {
    claim: () => Promise.resolve(role),
    waitForWriter: () =>
      new Promise<void>((resolve) => {
        free = resolve;
      }),
    announceSave: () => {
      announced.count += 1;
    },
    onSaved: (listener) => listeners.push(listener),
  };
  const otherTabSaved = (): void => {
    for (const listener of listeners) listener();
  };
  const freeLock = (): void => {
    free();
  };
  return { tabs, announced, otherTabSaved, freeLock };
}

async function start(adapter: StorageAdapter, tabs: TabCoordination) {
  const app = createTestApp({ commands: COMMANDS });
  const options = { ...app, adapter, tabs, propsSchemas: TEST_PROPS_SCHEMAS };
  const result = await startRepository(options);
  return { ...app, result };
}

describe("workspace repository across tabs", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("opens a reader tab read-only and never saves from it", async () => {
    const { storage, adapter } = sharedStorage(storedPages("a"));
    const { tabs } = fakeTabs("reader");
    const { store, dispatch } = await start(adapter, tabs);

    dispatch(setSidebarWidth.create({ width: 20 }));
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

    expect(store.getState().persistence.isReadOnly).toBe(true);
    expect(storage.saves).toBe(0);
  });

  it("does not offer a first run to a reader tab", async () => {
    const { adapter } = sharedStorage(storedPages());
    const reader = fakeTabs("reader");

    const { result } = await start(
      { ...adapter, load: () => Promise.resolve(null) },
      reader.tabs,
    );

    expect(result.isFirstRun).toBe(false);
  });

  it("reloads in a reader tab when the writer tab saves", async () => {
    const { storage, adapter } = sharedStorage(storedPages("a"));
    const reader = fakeTabs("reader");
    const { store } = await start(adapter, reader.tabs);

    storage.stored = storedPages("a", "b");
    reader.otherTabSaved();
    await vi.advanceTimersByTimeAsync(0);

    expect(store.getState().workspace.rootIds).toEqual(["a", "b"]);
  });

  it("becomes the writer once the writer tab closes", async () => {
    const { storage, adapter } = sharedStorage(storedPages("a"));
    const reader = fakeTabs("reader");
    const { store, dispatch } = await start(adapter, reader.tabs);

    storage.stored = storedPages("a", "b");
    reader.freeLock();
    await vi.advanceTimersByTimeAsync(0);
    dispatch(addTestBlock.create({ blockType: "page" }));
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

    expect(store.getState().persistence.isReadOnly).toBe(false);
    expect(store.getState().workspace.rootIds).toContain("b");
    expect(storage.saves).toBe(1);
  });

  it("tells the other tabs after each save in the writer tab", async () => {
    const { adapter } = sharedStorage(storedPages("a"));
    const writer = fakeTabs("writer");
    const { dispatch } = await start(adapter, writer.tabs);

    dispatch(addTestBlock.create({ blockType: "page" }));
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

    expect(writer.announced.count).toBe(1);
  });
});
