import "./shell.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { renderEditor } from "../features/editor/index.ts";
import { renderFormatToolbar } from "../features/format-toolbar/index.ts";
import {
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
import { renderButton } from "../ui/button/index.ts";
import { COPY } from "../ui/copy.ts";
import { renderOverlay } from "./shell-overlays.view.ts";
import { renderSidebarPanel } from "./shell-sidebar.view.ts";
import { setWidth } from "./sidebar-width.ts";
import { renderUpdatePrompt } from "./update-prompt.view.ts";

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
  </header>`;
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
    </main>
    <div class="app__peek" ?inert=${isBehind}>
      ${renderPeek(state, dispatch)}
    </div>
    ${renderUpdatePrompt(state, dispatch)}
  </div>`;
}
