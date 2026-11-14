import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../model/index.ts";
import {
  createTestApp,
  pageVersionCommands,
  setPageViews,
  setViewsPeriod,
  showPageUpdates,
} from "./index.ts";

const DOC = toBlockId("doc");
const VIEW = { viewedAt: "2026-11-14T09:00:00.000Z", viewer: "Ada" };

function setup() {
  const workspace = buildWorkspace([{ id: "doc" }, { id: "other" }]);
  return createTestApp({ workspace, commands: [...pageVersionCommands] });
}

describe("the Updates & analytics panel", () => {
  it("opens on Updates, keeps the views read while it changes tab", () => {
    const app = setup();

    app.dispatch(showPageUpdates.create({ pageId: DOC }));
    const opened = app.store.getState().ui.pageUpdates;
    app.dispatch(setPageViews.create({ pageId: DOC, views: [VIEW] }));
    app.dispatch(showPageUpdates.create({ pageId: DOC, tab: "analytics" }));

    expect(opened).toEqual({ pageId: DOC, tab: "updates" });
    expect(app.store.getState().ui.pageUpdates).toEqual({
      pageId: DOC,
      tab: "analytics",
      views: [VIEW],
    });
  });

  it("leaves out views read for another page, and closes", () => {
    const app = setup();
    app.dispatch(showPageUpdates.create({ pageId: DOC }));

    app.dispatch(
      setPageViews.create({ pageId: toBlockId("other"), views: [VIEW] }),
    );
    const kept = app.store.getState().ui.pageUpdates;
    app.dispatch(showPageUpdates.create({ pageId: null }));

    expect(kept).toEqual({ pageId: DOC, tab: "updates" });
    expect(app.store.getState().ui.pageUpdates).toBeUndefined();
  });
});

describe("the views' period", () => {
  it("is kept while the panel moves between tabs", () => {
    const app = setup();
    app.dispatch(showPageUpdates.create({ pageId: DOC, tab: "analytics" }));

    app.dispatch(setViewsPeriod.create({ period: 90 }));
    app.dispatch(showPageUpdates.create({ pageId: DOC, tab: "updates" }));

    expect(app.store.getState().ui.pageUpdates?.period).toBe(90);
  });
});
