// Notion's desktop notifications (ADR-0013): each notice that arrives in
// the inbox while they are on is also shown by the system, which opens
// the page it is about when clicked. The system's own Notification is
// passed in, so tests give a stand-in.
import type { AppState, AppStore } from "../../state/index.ts";
import { hashForBlock } from "../../ui/address/index.ts";
import { selectReminders, type Reminder } from "./inbox.selectors.ts";
import { todayOf } from "./inbox.view.ts";

export interface Notifier {
  readonly isAllowed: () => boolean;
  readonly show: (reminder: Reminder, open: () => void) => void;
}

function unread(state: AppState): Reminder[] {
  return selectReminders(state, todayOf(new Date())).filter(
    (reminder) => !reminder.isRead,
  );
}

export function startDesktopNotices(store: AppStore, notifier: Notifier) {
  const seen = new Set(unread(store.getState()).map((each) => each.key));
  store.subscribe((state) => {
    const fresh = unread(state).filter((each) => !seen.has(each.key));
    for (const reminder of fresh) seen.add(reminder.key);
    if (!state.ui.desktopNotices || !notifier.isAllowed()) return;
    for (const reminder of fresh) {
      notifier.show(reminder, () => {
        location.hash = hashForBlock(reminder.pageId, reminder.blockId);
      });
    }
  });
}

// The browser's Notification, when it has one.
export function browserNotifier(): Notifier {
  return {
    isAllowed: () =>
      typeof Notification !== "undefined" &&
      Notification.permission === "granted",
    show: (reminder, open) => {
      const shown = new Notification(reminder.text, {
        body: reminder.pageTitle,
        tag: reminder.key,
      });
      shown.addEventListener("click", () => {
        window.focus();
        open();
      });
    },
  };
}
