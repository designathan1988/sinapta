import { describe, expect, it } from "vitest";
import { createTestApp } from "./state-builder.ts";
import { uiCommands } from "./ui.commands.ts";
import { applyUpdate, dismissUpdate, updateReady } from "./update.commands.ts";

function createApp() {
  return createTestApp({ commands: uiCommands });
}

describe("a new version of the app", () => {
  it("is offered once ready, and applied when asked for", () => {
    const { store, dispatch } = createApp();
    expect(store.getState().ui.update).toBe("none");

    dispatch(updateReady.create({}));
    expect(store.getState().ui.update).toBe("ready");

    dispatch(applyUpdate.create({}));
    expect(store.getState().ui.update).toBe("applying");
  });

  it("can wait: the offer is put away until the next reload", () => {
    const { store, dispatch } = createApp();
    dispatch(updateReady.create({}));

    dispatch(dismissUpdate.create({}));

    expect(store.getState().ui.update).toBe("none");
  });

  it("is applied only once it is ready", () => {
    const { store, dispatch } = createApp();

    dispatch(applyUpdate.create({}));

    expect(store.getState().ui.update).toBe("none");
  });
});
