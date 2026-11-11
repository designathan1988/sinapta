import { describe, expect, it } from "vitest";
import { createTestApp } from "./state-builder.ts";
import {
  closeChildOverlay,
  openChildOverlay,
  openOverlayPanel,
  setOverlayQuery,
} from "./ui-overlay.commands.ts";
import { openOverlay, uiCommands } from "./ui.commands.ts";

function withOverlay() {
  const app = createTestApp({ commands: uiCommands });
  const overlay = { kind: "settings", anchorId: "db" };
  app.dispatch(openOverlay.create({ overlay }));
  return { ...app, overlay: () => app.store.getState().ui.overlay };
}

describe("an overlay's panels and child list", () => {
  it("moves to a panel and back, leaving the panel's search and list behind", () => {
    const app = withOverlay();

    app.dispatch(openChildOverlay.create({ anchorId: "sort" }));
    app.dispatch(openOverlayPanel.create({ panel: "group" }));
    expect(app.overlay()).toEqual({
      kind: "settings",
      anchorId: "db",
      panel: "group",
    });

    app.dispatch(openOverlayPanel.create({ panel: null }));
    expect(app.overlay()).toEqual({ kind: "settings", anchorId: "db" });
  });

  it("opens a list inside the overlay, searches it and closes it alone", () => {
    const app = withOverlay();

    app.dispatch(openChildOverlay.create({ anchorId: "sort" }));
    app.dispatch(setOverlayQuery.create({ query: "na" }));
    expect(app.overlay()?.child).toEqual({ anchorId: "sort", query: "na" });

    app.dispatch(closeChildOverlay.create({}));
    expect(app.overlay()).toEqual({ kind: "settings", anchorId: "db" });
  });

  it("searches the overlay itself when no list is open in it", () => {
    const app = withOverlay();

    app.dispatch(setOverlayQuery.create({ query: "x" }));

    expect(app.overlay()?.query).toBe("x");
  });

  it("does nothing while no overlay is open", () => {
    const app = createTestApp({ commands: uiCommands });

    app.dispatch(openChildOverlay.create({ anchorId: "sort" }));
    app.dispatch(openOverlayPanel.create({ panel: "group" }));

    expect(app.store.getState().ui.overlay).toBeNull();
  });
});
