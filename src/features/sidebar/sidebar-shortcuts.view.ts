// The sidebar's shortcuts, in the order "Customize sidebar" left them: New
// page, New database, Settings and pages the owner pinned, each a row with
// its icon and name that does what it says.
import { html, type TemplateResult } from "lit-html";
import {
  createPage,
  isPageLike,
  selectPageTitle,
} from "../../blocks/page/index.ts";
import {
  openOverlay,
  setActivePage,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon, type IconName } from "../../ui/icon/index.ts";
import { SETTINGS_OVERLAY_KIND } from "../../ui/shortcuts/index.ts";
import { createDatabase } from "../database/index.ts";
import { selectShortcuts, shortcutPageId } from "./sidebar-layout.selectors.ts";

// A glyph, or a page's emoji, beside the shortcut's name.
export interface ShortcutLook {
  readonly label: string;
  readonly icon: IconName;
  readonly emoji?: string;
}

const BUILT_IN_LOOKS: Readonly<Record<string, ShortcutLook>> = {
  "new-page": { label: COPY.sidebar.newPage, icon: "compose" },
  "new-database": { label: COPY.database.newDatabase, icon: "table" },
  settings: { label: COPY.shell.openSettings, icon: "settings" },
};

export function shortcutLook(
  state: AppState,
  key: string,
): ShortcutLook | undefined {
  const builtIn = BUILT_IN_LOOKS[key];
  if (builtIn !== undefined) return builtIn;
  const pageId = shortcutPageId(state, key);
  const page =
    pageId === undefined ? undefined : state.workspace.blocks[pageId];
  if (page === undefined || !isPageLike(page)) return undefined;
  const title = selectPageTitle(page);
  const emoji = page.props.icon;
  return {
    label: title === "" ? COPY.sidebar.untitled : title,
    icon: "page",
    ...(typeof emoji === "string" && { emoji }),
  };
}

export function renderShortcutIcon(look: ShortcutLook): TemplateResult {
  return html`<span class="sidebar__icon" aria-hidden="true"
    >${look.emoji ?? renderIcon(look.icon)}</span
  >`;
}

export function runShortcut(
  state: AppState,
  dispatch: Dispatch,
  key: string,
): void {
  if (key === "new-page") dispatch(createPage.create({ parentId: null }));
  else if (key === "new-database") {
    dispatch(createDatabase.create({ parentId: null }));
  } else if (key === "settings") {
    dispatch(openOverlay.create({ overlay: { kind: SETTINGS_OVERLAY_KIND } }));
  } else {
    const pageId = shortcutPageId(state, key);
    if (pageId !== undefined) dispatch(setActivePage.create({ pageId }));
  }
}

export function renderShortcuts(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const rows = selectShortcuts(state).flatMap((key) => {
    const look = shortcutLook(state, key);
    if (look === undefined) return [];
    const pageId = shortcutPageId(state, key);
    const current = pageId !== undefined && pageId === state.ui.activePageId;
    return [
      html`<button
        type="button"
        class="sidebar__item"
        aria-current=${current ? "page" : "false"}
        @click=${() => {
          runShortcut(state, dispatch, key);
        }}
      >
        ${renderShortcutIcon(look)}
        <span class="sidebar__title">${look.label}</span>
      </button>`,
    ];
  });
  return html`<div class="sidebar__quick">${rows}</div>`;
}
