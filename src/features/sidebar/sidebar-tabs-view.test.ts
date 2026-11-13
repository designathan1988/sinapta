// @vitest-environment happy-dom
import { render } from "lit-html";
import { describe, expect, it } from "vitest";
import {
  createInitialState,
  setSectionTab,
  type Command,
} from "../../state/index.ts";
import { moveToTabItem } from "./sidebar-move-tab.ts";
import { renderSidebarTabs } from "./sidebar-tabs.view.ts";

describe("the sidebar's tabs", () => {
  it("shows Home with its name and switches to Calendar", () => {
    const sent: Command[] = [];
    const host = document.createElement("div");
    document.body.replaceChildren(host);
    render(
      renderSidebarTabs(createInitialState(), (command) => {
        sent.push(command);
        return { ok: true };
      }),
      host,
    );
    const tabs = [...host.querySelectorAll<HTMLElement>("[role=tab]")];

    tabs[1]?.click();

    expect(tabs.map((tab) => tab.textContent.trim())).toEqual(["Home", ""]);
    expect(sent).toEqual([
      expect.objectContaining({
        type: "settings.setSidebarTab",
        tab: "calendar",
      }),
    ]);
  });

  it("moves a section to the Calendar tab from Move to tab", () => {
    const sent: Command[] = [];
    const item = moveToTabItem(
      createInitialState(),
      (command) => {
        sent.push(command);
        return { ok: true };
      },
      "favorites",
    );
    const calendar = item.submenu?.menu().items[1];

    if (calendar !== undefined && "onSelect" in calendar) calendar.onSelect?.();

    expect(item.label).toBe("Move to tab");
    expect(sent).toEqual([
      expect.objectContaining({
        type: setSectionTab.type,
        key: "favorites",
        tab: "calendar",
      }),
    ]);
  });
});
