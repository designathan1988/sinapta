// Reminders while the app is open, as Notion's: on its day, from 9:00, a
// reminder not yet read shows as a browser notification, once. The browser
// is asked for leave to notify only once a reminder exists, and once.
import { selectAllReminders, type Reminder } from "../features/inbox/index.ts";
import type { AppStore } from "../state/index.ts";
import { COPY } from "../ui/copy.ts";

const CHECK_EVERY_MS = 60_000;
const REMIND_AT_HOUR = 9;

export interface NoticeHost {
  readonly permission: () => NotificationPermission;
  readonly ask: () => void;
  readonly show: (title: string, body: string) => void;
  readonly now: () => Date;
}

function isDue(reminder: Reminder, now: Date): boolean {
  const today = now.toLocaleDateString("en-CA");
  if (reminder.date < today) return true;
  return reminder.date === today && now.getHours() >= REMIND_AT_HOUR;
}

export function checkReminders(
  store: AppStore,
  host: NoticeHost,
  shown: Set<string>,
): void {
  const reminders = selectAllReminders(store.getState());
  if (reminders.length === 0) return;
  const permission = host.permission();
  if (permission === "default") {
    host.ask();
    return;
  }
  if (permission !== "granted") return;
  const now = host.now();
  for (const reminder of reminders) {
    if (reminder.isRead || shown.has(reminder.key) || !isDue(reminder, now))
      continue;
    shown.add(reminder.key);
    host.show(COPY.inbox.reminder, `${reminder.text} — ${reminder.pageTitle}`);
  }
}

export function startReminderNotices(store: AppStore): void {
  if (typeof Notification === "undefined") return;
  let hasAsked = false;
  const host: NoticeHost = {
    permission: () => (hasAsked ? "denied" : Notification.permission),
    ask: () => {
      hasAsked = true;
      void Notification.requestPermission().then(() => {
        hasAsked = false;
      });
    },
    show: (title, body) => {
      const notice = new Notification(title, { body });
      notice.onclick = () => {
        window.focus();
      };
    },
    now: () => new Date(),
  };
  const shown = new Set<string>();
  const check = (): void => {
    checkReminders(store, host, shown);
  };
  check();
  setInterval(check, CHECK_EVERY_MS);
}
