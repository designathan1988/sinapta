// The sidebar's tabs, as Notion's: which one shows, the tab a section is
// moved to ("Move to tab"), and the views whose dated pages the Calendar
// tab lists ("Manage in calendar"). The owner's own, kept with the
// settings and outside undo.
import type { Settings } from "../model/index.ts";
import { defineCommand, type CommandEffect } from "./command-registry.ts";

export type SidebarTab = NonNullable<Settings["sidebarTab"]>;

function withSettings(patch: Partial<Settings>): CommandEffect {
  return { operations: [{ type: "record.update", kind: "settings", patch }] };
}

export const setSidebarTab = defineCommand<{ tab: SidebarTab }>({
  type: "settings.setSidebarTab",
  handle: (_state, command) => withSettings({ sidebarTab: command.tab }),
});

export const setSectionTab = defineCommand<{ key: string; tab: SidebarTab }>({
  type: "settings.setSectionTab",
  handle(state, command) {
    const { [command.key]: _old, ...rest } =
      state.workspace.settings.sectionTabs ?? {};
    const tabs =
      command.tab === "home" ? rest : { ...rest, [command.key]: command.tab };
    return withSettings({ sectionTabs: tabs });
  },
});

export const setCalendarView = defineCommand<{
  viewId: string;
  isShown: boolean;
}>({
  type: "settings.setCalendarView",
  handle(state, command) {
    const ids = (state.workspace.settings.calendarViewIds ?? []).filter(
      (id) => id !== command.viewId,
    );
    const calendarViewIds = command.isShown ? [...ids, command.viewId] : ids;
    return withSettings({ calendarViewIds });
  },
});

export const sidebarTabCommands = [
  setSidebarTab,
  setSectionTab,
  setCalendarView,
];
