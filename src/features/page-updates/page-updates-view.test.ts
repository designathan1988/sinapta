// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import { buildWorkspace, toBlockId } from "../../model/index.ts";
import {
  createInitialState,
  type Command,
  type PageUpdatesTab,
} from "../../state/index.ts";
import { renderPageUpdatesPanel } from "./page-updates.view.ts";

const PAGE = toBlockId("page");

function rendered(tab: PageUpdatesTab, showsHistory?: boolean) {
  const workspace = buildWorkspace([{ id: "page" }]);
  const initial = createInitialState();
  const views = [{ viewedAt: "2026-11-14T09:00:00.000Z", viewer: "Ada" }];
  const pageUpdates = {
    pageId: PAGE,
    tab,
    views,
    ...(showsHistory !== undefined && { showsHistory }),
  };
  const state = { ...initial, workspace, ui: { ...initial.ui, pageUpdates } };
  const sent: Command[] = [];
  const host = document.createElement("div");
  render(
    renderPageUpdatesPanel(state, (command) => {
      sent.push(command);
      return { ok: true };
    }),
    host,
  );
  return { host, sent };
}

describe("the Updates & analytics panel", () => {
  it("moves to Analytics from its tab", () => {
    const { host, sent } = rendered("updates");
    const tabs = [...host.querySelectorAll<HTMLElement>("[role=tab]")];

    tabs[1]?.click();

    expect(tabs.map((tab) => tab.textContent.trim())).toEqual([
      "Updates",
      "Analytics",
    ]);
    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "ui.showPageUpdates",
        pageId: PAGE,
        tab: "analytics",
      }),
    );
  });

  it("shows the views, the viewers and the editors on Analytics", () => {
    const { host } = rendered("analytics");

    const text = host.textContent;

    expect(text).toContain("(1 total)");
    expect(text).toContain("Ada");
    expect(text).toContain("Created by");
    expect(host.querySelector(".page-updates__chart")).not.toBeNull();
  });

  it("closes from its button", () => {
    const { host, sent } = rendered("updates");

    host.querySelector<HTMLElement>(".page-updates__close")?.click();

    expect(sent).toContainEqual(
      expect.objectContaining({ type: "ui.showPageUpdates", pageId: null }),
    );
  });
});

describe("the views' period, as Notion's", () => {
  it("opens its menu from the chip under Analytics", () => {
    const { host, sent } = rendered("analytics");
    const chip = host.querySelector<HTMLElement>(".page-updates__period");

    chip?.click();

    expect(chip?.textContent).toContain("Last 28 days");
    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: "views-period", anchorId: "views-period" },
      }),
    );
  });
});

describe("Show your view history, as Notion's", () => {
  it("shows on a server workspace with its choice, and opens its menu", () => {
    const { host, sent } = rendered("analytics", false);
    const choice = host.querySelector<HTMLElement>(
      ".page-updates__history-choice",
    );

    choice?.click();

    expect(host.textContent).toContain("Show your view history");
    expect(choice?.textContent).toContain("Don't allow");
    expect(sent).toContainEqual(
      expect.objectContaining({
        type: "ui.openOverlay",
        overlay: { kind: "view-history", anchorId: "view-history" },
      }),
    );
  });

  it("is left out where no server keeps the views", () => {
    const { host } = rendered("analytics");

    expect(host.querySelector(".page-updates__history-box")).toBeNull();
  });
});
