import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { TEST_PROPS_SCHEMAS } from "../model/index.ts";
import {
  addTestBlock,
  createTestApp,
  persistenceCommands,
} from "../state/index.ts";
import { createMemoryAdapter } from "./storage-adapter.ts";
import { SAVE_DEBOUNCE_MS, startRepository } from "./workspace-repository.ts";

describe("keeping the workspace", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllGlobals();
  });

  it("asks the browser once, after the first save, not to evict the data", async () => {
    const persist = vi.fn(() => Promise.resolve(true));
    vi.stubGlobal("navigator", { storage: { persist } });
    const app = createTestApp({
      commands: [addTestBlock, ...persistenceCommands],
    });
    await startRepository({
      ...app,
      adapter: createMemoryAdapter(),
      propsSchemas: TEST_PROPS_SCHEMAS,
    });

    expect(persist).not.toHaveBeenCalled();
    app.dispatch(addTestBlock.create({ blockType: "page" }));
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);
    app.dispatch(addTestBlock.create({ blockType: "page" }));
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

    expect(persist).toHaveBeenCalledTimes(1);
  });
});
