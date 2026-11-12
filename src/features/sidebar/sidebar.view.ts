import "./sidebar.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { createPage } from "../../blocks/page/index.ts";
import {
  openHome,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  PALETTE_OVERLAY_KIND,
  SETTINGS_OVERLAY_KIND,
} from "../../ui/shortcuts/index.ts";
import { createDatabase, importCsvFile } from "../database/index.ts";
import { TEMPLATE_GALLERY_OVERLAY } from "../templates/index.ts";
import { TRASH_OVERLAY } from "../trash/index.ts";
import { importMarkdownFile } from "../markdown-import/index.ts";
import { INBOX_OVERLAY, selectUnreadCount, todayOf } from "../inbox/index.ts";
import { renderFavorites } from "./sidebar-favorites.view.ts";
import { renderTree } from "./sidebar-tree.view.ts";
import { selectTreeRows } from "./sidebar.selectors.ts";

// Settings and the trash, at the foot of the sidebar as in Notion.
function renderFooter(dispatch: Dispatch): TemplateResult {
  const open = (kind: string) => () =>
    dispatch(openOverlay.create({ overlay: { kind } }));
  return html`<div class="sidebar__footer">
    ${renderButton({
      label: COPY.shell.openSettings,
      icon: "settings",
      onClick: open(SETTINGS_OVERLAY_KIND),
    })}
    ${renderButton({
      label: COPY.templates.open,
      icon: "templates",
      onClick: open(TEMPLATE_GALLERY_OVERLAY),
    })}
    ${renderImport(dispatch)}
    ${renderButton({
      label: COPY.trash.open,
      icon: "trash",
      onClick: open(TRASH_OVERLAY),
    })}
  </div>`;
}

// Import, as in Notion's sidebar: a CSV file becomes a new database, a
// Markdown file a new page.
function renderImport(dispatch: Dispatch): TemplateResult {
  const onChange = (event: Event): void => {
    const input = event.target;
    if (!(input instanceof HTMLInputElement)) return;
    const files = [...(input.files ?? [])];
    input.value = "";
    for (const file of files) {
      const isMarkdown = /\.(md|markdown)$/i.test(file.name);
      void (isMarkdown ? importMarkdownFile : importCsvFile)(file, dispatch);
    }
  };
  return html`<label class="button sidebar__import" data-variant="quiet">
    ${renderIcon("download")}
    <span>${COPY.sidebar.import}</span>
    <input
      class="visually-hidden"
      type="file"
      multiple
      accept=".csv,text/csv,.md,.markdown,text/markdown"
      @change=${onChange}
    />
  </label>`;
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
    ${renderIcon("search")}
    <span class="sidebar__search-label">${COPY.sidebar.search}</span>
    <kbd aria-hidden="true">${COPY.sidebar.searchShortcut}</kbd>
  </button>`;
}

// Inbox, as Notion's: a bell, and the count of unread reminders.
function renderInboxItem(state: AppState, dispatch: Dispatch): TemplateResult {
  const unread = selectUnreadCount(state, todayOf(new Date()));
  const overlay = { kind: INBOX_OVERLAY };
  return html`<button
    type="button"
    class="button sidebar__inbox"
    data-variant="quiet"
    @click=${() => dispatch(openOverlay.create({ overlay }))}
  >
    ${renderIcon("bell")}
    <span>${COPY.inbox.open}</span>
    ${
      unread === 0
        ? nothing
        : html`<span
            class="sidebar__badge"
            aria-label=${COPY.inbox.unread(unread)}
            >${unread}</span
          >`
    }
  </button>`;
}

// Search, home, the inbox and the ways to start something new.
function renderQuickItems(state: AppState, dispatch: Dispatch): TemplateResult {
  return html`${renderSearch(dispatch)}
    <div class="sidebar__quick">
      ${renderButton({
        label: COPY.home.title,
        icon: "home",
        onClick: () => dispatch(openHome.create({})),
      })}
      ${renderInboxItem(state, dispatch)}
      ${renderButton({
        label: COPY.sidebar.newPage,
        icon: "compose",
        onClick: () => dispatch(createPage.create({ parentId: null })),
      })}
      ${renderButton({
        label: COPY.database.newDatabase,
        icon: "table",
        onClick: () => dispatch(createDatabase.create({ parentId: null })),
      })}
    </div>`;
}

function renderPrivate(state: AppState, dispatch: Dispatch): TemplateResult {
  const rows = selectTreeRows(state);
  return html`<section class="sidebar__section">
    <h2 class="sidebar__heading" id="sidebar-private">
      ${COPY.sidebar.private}
    </h2>
    ${
      rows.length === 0
        ? html`<p class="sidebar__empty">${COPY.shell.emptyWorkspace}</p>`
        : renderTree(rows, { state, dispatch })
    }
  </section>`;
}

// The sidebar panel: quick items, favorites, the page tree and actions.
export function renderSidebar(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  return html`<div class="sidebar">
    ${renderQuickItems(state, dispatch)} ${renderFavorites(state, dispatch)}
    ${renderPrivate(state, dispatch)} ${renderFooter(dispatch)}
  </div>`;
}
