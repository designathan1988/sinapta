import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../model/index.ts";
import {
  createTestApp,
  pageVersionCommands,
  setActivePage,
  setShowsHistory,
  showPageUpdates,
  uiCommands,
} from "../state/index.ts";
import { createMemoryPageViews, startPageViews } from "./page-views.ts";

const MINUTE = 60 * 1000;
const DOC = toBlockId("doc");
const HOME = toBlockId("home");

async function settled(): Promise<void> {
  for (let turn = 0; turn < 5; turn += 1) await Promise.resolve();
}

function setup() {
  const workspace = buildWorkspace([{ id: "doc" }, { id: "home" }]);
  const app = createTestApp({
    workspace,
    commands: [...uiCommands, ...pageVersionCommands],
  });
  let time = Date.parse("2026-11-14T09:00:00.000Z");
  const storage = createMemoryPageViews();
  startPageViews({
    store: app.store,
    dispatch: app.dispatch,
    storage,
    now: () => new Date(time).toISOString(),
  });
  const open = (pageId: typeof DOC, minutesLater = 0): void => {
    time += minutesLater * MINUTE;
    app.dispatch(setActivePage.create({ pageId }));
  };
  return { app, storage, open };
}

describe("page views", () => {
  it("keeps each opening of a page, once in half an hour", async () => {
    const { storage, open } = setup();

    open(DOC);
    open(HOME, 1);
    open(DOC, 1);
    open(HOME, 1);
    open(DOC, 40);
    await settled();

    const { views } = await storage.listViews(DOC);
    expect(views.map((view) => view.viewedAt)).toEqual([
      "2026-11-14T09:00:00.000Z",
      "2026-11-14T09:43:00.000Z",
    ]);
  });

  it("reads the page's views when its panel opens", async () => {
    const { app, open } = setup();
    open(DOC);
    await settled();

    app.dispatch(showPageUpdates.create({ pageId: DOC, tab: "analytics" }));
    await settled();

    expect(app.store.getState().ui.pageUpdates).toEqual({
      pageId: DOC,
      tab: "analytics",
      views: [{ viewedAt: "2026-11-14T09:00:00.000Z", viewer: null }],
    });
  });
});

describe("Show your view history", () => {
  it("is sent once when chosen in the open panel", async () => {
    const { app, storage } = setup();
    const sent: boolean[] = [];
    const keep = storage.setShowsHistory.bind(storage);
    storage.setShowsHistory = (allowed) => {
      sent.push(allowed);
      return keep(allowed);
    };
    app.dispatch(showPageUpdates.create({ pageId: DOC, tab: "analytics" }));
    await settled();

    app.dispatch(setShowsHistory.create({ allowed: false }));
    app.dispatch(showPageUpdates.create({ pageId: DOC, tab: "updates" }));
    await settled();

    expect(sent).toEqual([false]);
  });
});
