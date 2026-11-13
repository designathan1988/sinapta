import { describe, expect, it } from "vitest";
import { createTestApp } from "./state-builder.ts";
import {
  closeChildOverlay,
  openChildOverlay,
  openOverlayPanel,
  setOverlayQuery,
  setOverlayValues,
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
    expect(app.overlay()?.children).toEqual([
      { anchorId: "sort", query: "na" },
    ]);

    app.dispatch(closeChildOverlay.create({}));
    expect(app.overlay()).toEqual({ kind: "settings", anchorId: "db" });
  });

  it("opens a submenu inside a submenu, keeping the ones it sits in", () => {
    const app = withOverlay();

    app.dispatch(openChildOverlay.create({ anchorId: "edit" }));
    app.dispatch(openChildOverlay.create({ anchorId: "format", depth: 1 }));
    expect(app.overlay()?.children).toEqual([
      { anchorId: "edit" },
      { anchorId: "format" },
    ]);

    app.dispatch(openChildOverlay.create({ anchorId: "type", depth: 0 }));
    expect(app.overlay()?.children).toEqual([{ anchorId: "type" }]);
  });

  it("closes the submenus from a depth on, the innermost by default", () => {
    const app = withOverlay();
    app.dispatch(openChildOverlay.create({ anchorId: "edit" }));
    app.dispatch(openChildOverlay.create({ anchorId: "format", depth: 1 }));

    app.dispatch(closeChildOverlay.create({}));
    expect(app.overlay()?.children).toEqual([{ anchorId: "edit" }]);

    app.dispatch(openChildOverlay.create({ anchorId: "format", depth: 1 }));
    app.dispatch(closeChildOverlay.create({ depth: 0 }));
    expect(app.overlay()).toEqual({ kind: "settings", anchorId: "db" });
  });

  it("searches the innermost submenu", () => {
    const app = withOverlay();
    app.dispatch(openChildOverlay.create({ anchorId: "edit" }));
    app.dispatch(openChildOverlay.create({ anchorId: "format", depth: 1 }));

    app.dispatch(setOverlayQuery.create({ query: "eu" }));

    expect(app.overlay()?.children).toEqual([
      { anchorId: "edit" },
      { anchorId: "format", query: "eu" },
    ]);
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

describe("an overlay's chosen values", () => {
  it("are set by name with its lists kept open, and taken away by null", () => {
    const app = withOverlay();
    app.dispatch(openChildOverlay.create({ anchorId: "in" }));

    app.dispatch(setOverlayValues.create({ name: "in", values: ["a", "b"] }));
    app.dispatch(setOverlayValues.create({ name: "date", values: [] }));
    expect(app.overlay()).toEqual({
      kind: "settings",
      anchorId: "db",
      children: [{ anchorId: "in" }],
      values: { in: ["a", "b"], date: [] },
    });

    app.dispatch(setOverlayValues.create({ name: "in", values: null }));
    app.dispatch(setOverlayValues.create({ name: "date", values: null }));
    expect(app.overlay()?.values).toBeUndefined();
  });
});
