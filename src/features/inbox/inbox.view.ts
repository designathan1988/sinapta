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

export function renderInbox(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const reminders = selectReminders(state, todayOf(new Date()));
  const unread = reminders.filter((item) => !item.isRead);
  const content = html`${
    unread.length === 0
      ? nothing
      : html`<div class="inbox__actions">
          ${renderButton({
            label: TEXT.markAllRead,
            onClick: () =>
              dispatch(
                markRemindersRead.create({
                  keys: unread.map((item) => item.key),
                }),
              ),
          })}
        </div>`
  }
  ${
    reminders.length === 0
      ? html`<p class="inbox__empty">${TEXT.empty}</p>`
      : html`<ul class="inbox__list">
          ${reminders.map((item) => renderItem(item, dispatch))}
        </ul>`
  }`;
  return renderDialog({
    title: TEXT.title,
    closeLabel: TEXT.close,
    content,
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
