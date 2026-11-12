import "./shell.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { renderEditor } from "../features/editor/index.ts";
import { renderFormatToolbar } from "../features/format-toolbar/index.ts";
import {
  openOverlay,
  selectIsHomeShown,
  selectIsSidebarShown,
  toggleSidebar,
  type AppState,
  type Dispatch,
} from "../state/index.ts";
import { renderBreadcrumbs } from "../features/breadcrumbs/index.ts";
import { renderHome } from "../features/home/index.ts";
import { renderPageInfo } from "../features/page-info/index.ts";
import { renderPageMenuButton } from "../features/page-menu/index.ts";
import { renderPeek } from "../features/row-peek/index.ts";
import { SETTINGS_OVERLAY } from "../features/settings/index.ts";
import { renderButton } from "../ui/button/index.ts";
import { SHORTCUT_HELP_OVERLAY_KIND } from "../ui/shortcuts/index.ts";
import { COPY } from "../ui/copy.ts";
import { renderOverlay } from "./shell-overlays.view.ts";
import { renderSidebarPanel } from "./shell-sidebar.view.ts";
import { setWidth } from "./sidebar-width.ts";

function renderActivePageMenu(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const pageId = state.ui.activePageId;
  if (pageId === null) return nothing;
  return renderPageMenuButton({ place: "bar", pageId, state, dispatch });
}

// The button that brings back a hidden sidebar, or opens the drawer.
function renderShowSidebar(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  if (selectIsSidebarShown(state)) return nothing;
  return html`<span data-sidebar-open
    >${renderButton({
      label: COPY.shell.showSidebar,
      icon: "sidebar",
      isIconOnly: true,
      onClick: () => dispatch(toggleSidebar.create({})),
    })}</span
  >`;
}

function renderTopBar(state: AppState, dispatch: Dispatch): TemplateResult {
  return html`<header class="app__top-bar">
    ${renderShowSidebar(state, dispatch)}
    ${
      selectIsHomeShown(state)
        ? html`<span class="app__place">${COPY.home.title}</span>`
        : renderBreadcrumbs(state, dispatch)
    }
    <span class="app__spacer"></span>
    <span class="app__save-status" role="status"
      >${
        state.persistence.isReadOnly
          ? COPY.shell.readOnlyTab
          : COPY.saveStatus[state.persistence.status]
      }</span
    >
    ${
      selectIsHomeShown(state)
        ? nothing
        : [
            renderPageInfo(state, dispatch),
            renderActivePageMenu(state, dispatch),
          ]
    }
    ${renderButton({
      label: COPY.shell.openSettings,
      icon: "settings",
      isIconOnly: true,
      onClick: () =>
        dispatch(openOverlay.create({ overlay: { kind: SETTINGS_OVERLAY } })),
    })}
  </header>`;
}

// Help in the corner, as in Notion: it opens the keyboard shortcuts.
function renderHelpButton(dispatch: Dispatch): TemplateResult {
  const overlay = { kind: SHORTCUT_HELP_OVERLAY_KIND };
  return html`<span class="app__help">
    ${renderButton({
      label: COPY.shortcutHelp.open,
      icon: "help",
      isIconOnly: true,
      onClick: () => dispatch(openOverlay.create({ overlay })),
    })}
  </span>`;
}

export function renderShell(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const { isNarrow, isDrawerOpen, sidebarWidth } = state.ui;
  // An open drawer keeps the focus: all else is out of reach behind it.
  const isBehind = isNarrow && isDrawerOpen;
  return html`<div
    class="app"
    ?data-sidebar-collapsed=${isNarrow || !selectIsSidebarShown(state)}
    ?data-narrow=${isNarrow}
    data-peek=${state.ui.peek?.mode ?? nothing}
    ${ref((shell) => {
      setWidth(shell, sidebarWidth);
    })}
  >
    <a class="app__skip-link" href="#main" ?inert=${isBehind}
      >${COPY.shell.skipToContent}</a
    >
    ${renderSidebarPanel(state, dispatch)}
    <main class="app__main" id="main" tabindex="-1" ?inert=${isBehind}>
      ${renderTopBar(state, dispatch)}
      <div class="app__page">
        ${
          selectIsHomeShown(state)
            ? renderHome(state, dispatch)
            : renderEditor(state, dispatch)
        }
      </div>
      ${renderFormatToolbar(state, dispatch)} ${renderOverlay(state, dispatch)}
      ${renderHelpButton(dispatch)}
    </main>
    <div class="app__peek" ?inert=${isBehind}>
      ${renderPeek(state, dispatch)}
    </div>
  </div>`;
}
