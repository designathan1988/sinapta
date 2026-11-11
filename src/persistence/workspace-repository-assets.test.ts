import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { buildWorkspace, TEST_PROPS_SCHEMAS } from "../model/index.ts";
import {
  createTestApp,
  loadWorkspace,
  persistenceCommands,
  uiCommands,
} from "../state/index.ts";
import { createMemoryAdapter } from "./storage-adapter.ts";
import { SAVE_DEBOUNCE_MS, startRepository } from "./workspace-repository.ts";

const COMMANDS = [loadWorkspace, ...uiCommands, ...persistenceCommands];

describe("workspace repository and assets", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("keeps an image stored as a data address as an asset, and rewrites it", async () => {
    const workspace = buildWorkspace([
      {
        id: "page",
        children: [
          {
            id: "img",
            type: "image",
            props: { src: "data:image/png;base64,AAEC", caption: "" },
          },
        ],
      },
    ]);
    const adapter = createMemoryAdapter({
      file: { schemaVersion: 11, ...workspace },
      ui: null,
    });
    // Any props will do for an image here, as for a page.
    const anyProps = TEST_PROPS_SCHEMAS.get("page");
    if (anyProps === undefined) throw new Error("setup failed");
    const propsSchemas = new Map([...TEST_PROPS_SCHEMAS, ["image", anyProps]]);
    const app = createTestApp({ commands: COMMANDS });

    await startRepository({ ...app, adapter, propsSchemas });
    await vi.advanceTimersByTimeAsync(SAVE_DEBOUNCE_MS);

    expect(adapter.assets.get("img")).toMatchObject({
      type: "image/png",
      size: 3,
    });
    const saved = adapter.saves
      .flatMap((save) => save.putBlocks)
      .find((block) => block.id === "img");
    expect(saved?.props).toMatchObject({ src: "", assetId: "img" });
  });
});
