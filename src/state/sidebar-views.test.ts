import { describe, expect, it } from "vitest";
import { parseViewId } from "../model/index.ts";
import {
  addSidebarView,
  moveSidebarView,
  removeSidebarView,
  setSidebarView,
} from "./sidebar-views.commands.ts";
import { createTestApp } from "./state-builder.ts";

const commands = [
  addSidebarView,
  setSidebarView,
  removeSidebarView,
  moveSidebarView,
];

// An app and two view ids, a and b; a section shows whichever is kept.
function appWithViews() {
  const app = createTestApp({ commands });
  const a = parseViewId("view-a");
  const b = parseViewId("view-b");
  if (a === undefined || b === undefined) throw new Error("view ids");
  const kept = () => app.store.getState().workspace.settings.sidebarViews;
  return { app, a, b, kept };
}

describe("views kept in the sidebar", () => {
  it("adds a view once, and undo leaves it", () => {
    const { app, a, kept } = appWithViews();

    app.dispatch(addSidebarView.create({ viewId: a }));
    app.dispatch(addSidebarView.create({ viewId: a }));
    app.dispatch({ type: "history.undo" });

    expect(kept()).toEqual([{ viewId: a }]);
  });

  it("changes a section, but never to a view another section shows", () => {
    const { app, a, b, kept } = appWithViews();
    app.dispatch(addSidebarView.create({ viewId: a }));
    app.dispatch(addSidebarView.create({ viewId: b }));

    app.dispatch(setSidebarView.create({ viewId: a, changes: { limit: 10 } }));
    app.dispatch(setSidebarView.create({ viewId: a, changes: { viewId: b } }));

    expect(kept()).toEqual([{ viewId: a, limit: 10 }, { viewId: b }]);
  });

  it("moves a section and removes it", () => {
    const { app, a, b, kept } = appWithViews();
    app.dispatch(addSidebarView.create({ viewId: a }));
    app.dispatch(addSidebarView.create({ viewId: b }));

    app.dispatch(moveSidebarView.create({ viewId: b, by: -1 }));
    expect(kept()?.map((entry) => entry.viewId)).toEqual([b, a]);

    app.dispatch(removeSidebarView.create({ viewId: b }));
    expect(kept()).toEqual([{ viewId: a }]);
  });
});
