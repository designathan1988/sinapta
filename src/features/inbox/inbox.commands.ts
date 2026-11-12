// Marking reminders read, which the inbox keeps across reloads.
import { defineCommand } from "../../state/index.ts";

export const markRemindersRead = defineCommand<{ keys: readonly string[] }>({
  type: "inbox.markRead",
  handle(state, command) {
    const read = new Set([...state.ui.readReminders, ...command.keys]);
    if (read.size === state.ui.readReminders.length) return {};
    return { ui: { ...state.ui, readReminders: [...read] } };
  },
});

export const inboxCommands = [markRemindersRead];
