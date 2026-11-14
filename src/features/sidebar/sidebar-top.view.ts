// The top of the sidebar, as Notion's: the button that hides it at the
// start of one row, the inbox and a new page at its end, then the search
// field with its shortcut.
import "./sidebar-top.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { createPage } from "../../blocks/page/index.ts";
import {
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { PALETTE_OVERLAY_KIND } from "../../ui/shortcuts/index.ts";
import { INBOX_OVERLAY, selectUnreadCount, todayOf } from "../inbox/index.ts";
import { toggleSidebarKeepingFocus } from "./sidebar-focus.ts";

// The inbox, with the count of unread reminders on its corner; the count
// is part of its name for screen readers.
function renderInbox(state: AppState, dispatch: Dispatch): TemplateResult {
  const unread = selectUnreadCount(state, todayOf(new Date()));
  const overlay = { kind: INBOX_OVERLAY };
  return html`<span class="sidebar__inbox">
    ${renderButton({
      label:
        unread === 0
          ? COPY.inbox.open
          : `${COPY.inbox.open}, ${COPY.inbox.unread(unread)}`,
      icon: "bell",
      isIconOnly: true,
      onClick: () => dispatch(openOverlay.create({ overlay })),
    })}
    ${
      unread === 0
        ? nothing
        : html`<span class="sidebar__badge" aria-hidden="true">${unread}</span>`
    }
  </span>`;
}

// A field-like button that opens the command palette, with its shortcut.
function renderSearch(dispatch: Dispatch): TemplateResult {
  const overlay = { kind: PALETTE_OVERLAY_KIND };
  return html`<button
    type="button"
    class="sidebar__search"
    aria-keyshortcuts="Control+K"
    @click=${() => dispatch(openOverlay.create({ overlay }))}
  >
    <span class="sidebar__search-label">${COPY.sidebar.search}</span>
    <kbd aria-hidden="true">${COPY.sidebar.searchShortcut}</kbd>
  </button>`;
}

export function renderSidebarTop(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  return html`<div class="sidebar__top">
      ${renderButton({
        label: COPY.shell.hideSidebar,
        icon: "sidebar",
        isIconOnly: true,
        onClick: () => {
          toggleSidebarKeepingFocus(dispatch);
        },
      })}
      <span class="sidebar__spacer"></span>
      ${renderInbox(state, dispatch)}
      ${renderButton({
        label: COPY.sidebar.newPage,
        icon: "compose",
        isIconOnly: true,
        onClick: () => dispatch(createPage.create({ parentId: null })),
      })}
    </div>
    ${renderSearch(dispatch)}`;
}
