import { describe, expect, it } from "vitest";
import { buildWorkspace } from "../model/index.ts";
import { createTestApp } from "./state-builder.ts";
import { loadServerWorkspace } from "./sync.commands.ts";

describe("the server's workspace, once read", () => {
  it("opens Home when no page was open, not an empty window", () => {
    const app = createTestApp({ commands: [loadServerWorkspace] });
    const workspace = buildWorkspace([{ id: "page" }]);

    app.dispatch(loadServerWorkspace.create({ workspace }));

    expect(app.store.getState().ui.isHomeOpen).toBe(true);
    expect(app.store.getState().ui.activePageId).toBeNull();
  });
});
