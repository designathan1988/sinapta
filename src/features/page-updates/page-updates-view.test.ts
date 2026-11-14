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

function rendered(tab: PageUpdatesTab) {
  const workspace = buildWorkspace([{ id: "page" }]);
  const initial = createInitialState();
  const views = [{ viewedAt: "2026-11-14T09:00:00.000Z", viewer: "Ada" }];
  const pageUpdates = { pageId: PAGE, tab, views };
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
