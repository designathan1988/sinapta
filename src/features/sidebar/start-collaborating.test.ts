import { describe, expect, it } from "vitest";
import { createPage } from "../../blocks/page/index.ts";
import {
  createTestApp,
  openOverlay,
  requestOpenSharing,
} from "../../state/index.ts";

// The sidebar's "Start collaborating" sends these three, in this order.
describe("Start collaborating", () => {
  it("makes a page, opens its Share menu and asks the server for its sharing", () => {
    const { store, dispatch } = createTestApp({
      commands: [createPage, openOverlay, requestOpenSharing],
    });

    dispatch(createPage.create({ parentId: null }));
    dispatch(openOverlay.create({ overlay: { kind: "share" } }));
    dispatch(requestOpenSharing.create({}));

    const { ui, persistence, workspace } = store.getState();
    expect(workspace.rootIds).toEqual([ui.activePageId]);
    expect(ui.overlay?.kind).toBe("share");
    expect(persistence.sync.request).toEqual({
      kind: "sharing",
      pageId: ui.activePageId,
    });
  });

  it("asks for nothing while no page is open", () => {
    const { store, dispatch } = createTestApp({
      commands: [requestOpenSharing],
    });

    dispatch(requestOpenSharing.create({}));

    expect(store.getState().persistence.sync.requestCount).toBe(0);
  });
});
