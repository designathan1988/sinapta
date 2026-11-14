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

// Shows new notices as the system's notifications too, or stops.
export const setDesktopNotices = defineCommand<{ isOn: boolean }>({
  type: "inbox.setDesktopNotices",
  handle: (state, { isOn }) => ({ ui: { ...state.ui, desktopNotices: isOn } }),
});

// Has the server push notices to this browser even while it is closed,
// as Notion's mobile push notifications, or stops.
export const setPushNotices = defineCommand<{ isOn: boolean }>({
  type: "inbox.setPushNotices",
  handle: (state, { isOn }) => ({ ui: { ...state.ui, pushNotices: isOn } }),
});

export const inboxCommands = [
  markRemindersRead,
  toggleNotices,
  setDesktopNotices,
  setPushNotices,
];
