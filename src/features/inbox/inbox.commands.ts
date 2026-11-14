// Marking reminders read, which the inbox keeps across reloads.
import { defineCommand, type NoticeKind } from "../../state/index.ts";

export const markRemindersRead = defineCommand<{ keys: readonly string[] }>({
  type: "inbox.markRead",
  handle(state, command) {
    const read = new Set([...state.ui.readReminders, ...command.keys]);
    if (read.size === state.ui.readReminders.length) return {};
    return { ui: { ...state.ui, readReminders: [...read] } };
  },
});

// Turns a kind of notice off or on again, as Settings › Notifications.
export const toggleNotices = defineCommand<{ kind: NoticeKind }>({
  type: "inbox.toggleNotices",
  handle(state, { kind }) {
    const muted = state.ui.mutedNotices;
    const mutedNotices = muted.includes(kind)
      ? muted.filter((each) => each !== kind)
      : [...muted, kind];
    return { ui: { ...state.ui, mutedNotices } };
  },
});

export const inboxCommands = [markRemindersRead, toggleNotices];
