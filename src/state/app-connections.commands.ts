// The apps a workspace has connected and its calendars' coming events, as
// the server answers them (Settings › Connections, Home's "Upcoming").
import { defineCommand } from "./command-registry.ts";
import type { CalendarEventSummary, ConnectedApp } from "./sync-state.ts";

export const setApps = defineCommand<{
  apps: readonly ConnectedApp[];
  events?: readonly CalendarEventSummary[];
}>({
  type: "sync.setApps",
  handle: (state, { apps, events }) => {
    const sync = {
      ...state.persistence.sync,
      apps,
      ...(events === undefined ? {} : { calendarEvents: events }),
    };
    return { persistence: { ...state.persistence, sync } };
  },
});

export const appConnectionCommands = [setApps];
