// The inbox, as Notion's: the reminders that are due, an unread dot on
// each not yet read, each opening its block; and "Mark all as read".
import "./inbox.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  closeOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { hashForBlock } from "../../ui/address/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderDialog } from "../../ui/dialog/index.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { markRemindersRead } from "./inbox.commands.ts";
import { selectReminders, type Reminder } from "./inbox.selectors.ts";

export const INBOX_OVERLAY = "inbox";

const TEXT = COPY.inbox;

const DAY = new Intl.DateTimeFormat("en-US", {
  month: "short",
  day: "numeric",
  timeZone: "UTC",
});

export const todayOf = (date: Date): string => date.toLocaleDateString("en-CA");

function open(reminder: Reminder, dispatch: Dispatch): void {
  dispatch(markRemindersRead.create({ keys: [reminder.key] }));
  dispatch(closeOverlay.create({}));
  location.hash = hashForBlock(reminder.pageId, reminder.blockId);
}

function renderItem(reminder: Reminder, dispatch: Dispatch): TemplateResult {
  return html`<li>
    <button
      type="button"
      class="inbox__item"
      ?data-unread=${!reminder.isRead}
      @click=${() => {
        open(reminder, dispatch);
      }}
    >
      ${renderIcon("bell")}
      <span class="inbox__text">
        <span class="inbox__title">${TEXT.reminder}: ${reminder.text}</span>
        <span class="inbox__meta"
          >${reminder.pageTitle} ·
          ${DAY.format(new Date(`${reminder.date}T00:00:00Z`))}</span
        >
      </span>
    </button>
  </li>`;
}

// The panel's own head, as Notion's: its title, "Mark all as read" while
// any is unread, and the close button.
function renderHeader(
  unread: readonly Reminder[],
  dispatch: Dispatch,
): TemplateResult {
  const markAll = () =>
    dispatch(
      markRemindersRead.create({ keys: unread.map((item) => item.key) }),
    );
  return html`<header class="inbox__header">
    <h3 class="inbox__heading">${TEXT.title}</h3>
    ${
      unread.length === 0
        ? nothing
        : renderButton({ label: TEXT.markAllRead, onClick: markAll })
    }
    ${renderButton({
      label: TEXT.close,
      icon: "close",
      isIconOnly: true,
      onClick: () => dispatch(closeOverlay.create({})),
    })}
  </header>`;
}

export function renderInbox(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const reminders = selectReminders(state, todayOf(new Date()));
  const unread = reminders.filter((item) => !item.isRead);
  const content = html`${renderHeader(unread, dispatch)}
  ${
    reminders.length === 0
      ? html`<p class="inbox__empty">
          ${renderIcon("bell")}<span>${TEXT.empty}</span>
        </p>`
      : html`<ul class="inbox__list">
          ${reminders.map((item) => renderItem(item, dispatch))}
        </ul>`
  }`;
  return renderDialog({
    variant: "flyout",
    title: TEXT.title,
    closeLabel: TEXT.close,
    content,
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
