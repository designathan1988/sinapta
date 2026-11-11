import { describe, expect, it } from "vitest";
import { setActivePage } from "../../state/index.ts";
import { openRow } from "../database/index.ts";
import { createPeekApp } from "./peek-builder.ts";
import {
  closePeek,
  expandPeek,
  setPeekMode,
  stepPeek,
} from "./peek.commands.ts";

// Three rows, the first open in a side peek.
function peeking() {
  const app = createPeekApp(["One", "Two", "Three"]);
  const [first, second] = app.rowIds;
  if (first === undefined || second === undefined) throw new Error("setup");
  app.dispatch(openRow.create({ rowId: first, viewId: app.viewId }));
  const peek = () => app.store.getState().ui.peek;
  const openMode = () =>
    app.store.getState().workspace.views[app.viewId]?.openMode;
  return { app, first, second, peek, openMode };
}

describe("the row peek", () => {
  it("steps to the next and the previous row in the view's order", () => {
    const { app, first, second, peek } = peeking();

    app.dispatch(stepPeek.create({ by: 1 }));
    expect(peek()?.pageId).toBe(second);
    app.dispatch(stepPeek.create({ by: -1 }));
    app.dispatch(stepPeek.create({ by: -1 }));

    expect(peek()?.pageId).toBe(first);
  });

  it("closes, or opens the row as its own page", () => {
    const closed = peeking();
    const expanded = peeking();

    closed.app.dispatch(closePeek.create({}));
    expanded.app.dispatch(expandPeek.create({}));

    expect(closed.peek()).toBeNull();
    expect(expanded.peek()).toBeNull();
    expect(expanded.app.store.getState().ui.activePageId).toBe(expanded.first);
  });

  it("switches between side and center peek, and remembers it in the view", () => {
    const { app, peek, openMode } = peeking();

    app.dispatch(setPeekMode.create({ mode: "center" }));

    expect(peek()?.mode).toBe("center");
    expect(openMode()).toBe("center");
  });

  it("opens the row as its own page when switched to full page", () => {
    const { app, first, peek, openMode } = peeking();

    app.dispatch(setPeekMode.create({ mode: "full" }));

    expect(peek()).toBeNull();
    expect(openMode()).toBe("full");
    expect(app.store.getState().ui.activePageId).toBe(first);
  });

  it("closes when another page opens", () => {
    const { app, peek } = peeking();

    app.dispatch(setActivePage.create({ pageId: app.databaseId }));

    expect(peek()).toBeNull();
  });
});
