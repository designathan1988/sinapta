import { describe, expect, it } from "vitest";
import {
  setCalendarView,
  setSectionTab,
  setSidebarTab,
  sidebarTabCommands,
} from "./sidebar-tabs.commands.ts";
import { createTestApp } from "./state-builder.ts";

function app() {
  const test = createTestApp({ commands: sidebarTabCommands });
  const settings = () => test.store.getState().workspace.settings;
  return { ...test, settings };
}

describe("the sidebar's tabs", () => {
  it("shows a tab and moves a section to it, outside undo", () => {
    const { dispatch, settings } = app();

    dispatch(setSidebarTab.create({ tab: "calendar" }));
    dispatch(setSectionTab.create({ key: "favorites", tab: "calendar" }));
    dispatch({ type: "history.undo" });

    expect(settings().sidebarTab).toBe("calendar");
    expect(settings().sectionTabs).toEqual({ favorites: "calendar" });

    dispatch(setSectionTab.create({ key: "favorites", tab: "home" }));
    expect(settings().sectionTabs).toEqual({});
  });

  it("lists a view in the Calendar tab, and takes it away", () => {
    const { dispatch, settings } = app();

    dispatch(setCalendarView.create({ viewId: "v1", isShown: true }));
    dispatch(setCalendarView.create({ viewId: "v2", isShown: true }));
    dispatch(setCalendarView.create({ viewId: "v1", isShown: false }));

    expect(settings().calendarViewIds).toEqual(["v2"]);
  });
});
