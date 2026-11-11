import "./shell.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { createPage } from "../blocks/page/index.ts";
import { renderEditor } from "../features/editor/index.ts";
import { renderFormatToolbar } from "../features/format-toolbar/index.ts";
import { renderSidebar } from "../features/sidebar/index.ts";
import {
  openOverlay,
  selectIsHomeShown,
  setSidebarWidth,
  SIDEBAR_WIDTH,
  toggleSidebar,
  type AppState,
  type Dispatch,
} from "../state/index.ts";
import { renderBreadcrumbs } from "../features/breadcrumbs/index.ts";
import { renderHome } from "../features/home/index.ts";
import { renderPageInfo } from "../features/page-info/index.ts";
import { renderPageMenuButton } from "../features/page-menu/index.ts";
import { SETTINGS_OVERLAY } from "../features/settings/index.ts";
import { renderButton } from "../ui/button/index.ts";
import { COPY, PRODUCT_NAME } from "../ui/copy.ts";
import { renderOverlay } from "./shell-overlays.view.ts";

const WIDTH_PROPERTY = "--app-sidebar-width";

function setWidth(shell: Element | null | undefined, width: number): void {
  if (shell instanceof HTMLElement) {
    shell.style.setProperty(WIDTH_PROPERTY, `${String(width)}rem`);
  }
}

// The pointer position converted to a sidebar width in rem.
function widthAt(event: PointerEvent): number {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return event.clientX / rem;
}

const KEY_STEPS: Record<string, (width: number) => number> = {
  ArrowLeft: (width) => width - SIDEBAR_WIDTH.step,
  ArrowRight: (width) => width + SIDEBAR_WIDTH.step,
  Home: () => SIDEBAR_WIDTH.min,
  End: () => SIDEBAR_WIDTH.max,
};

// The attribute tells the styles, and anyone looking, that a resize is
// under way.
function capturePointer(event: PointerEvent): void {
  if (event.currentTarget instanceof Element) {
    event.currentTarget.setPointerCapture(event.pointerId);
    event.currentTarget.closest(".app")?.setAttribute("data-resizing", "");
  }
}

// While dragging, the browser owns the width; the store gets it once.
function previewWidth(event: PointerEvent): void {
  const target = event.currentTarget;
  if (target instanceof Element && target.hasPointerCapture(event.pointerId)) {
    setWidth(target.closest(".app"), widthAt(event));
  }
}

function renderResizer(state: AppState, dispatch: Dispatch): TemplateResult {
  const { sidebarWidth } = state.ui;
  const onPointerUp = (event: PointerEvent): void => {
    if (event.currentTarget instanceof Element) {
      event.currentTarget.closest(".app")?.removeAttribute("data-resizing");
    }
    dispatch(setSidebarWidth.create({ width: widthAt(event) }));
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    const step = KEY_STEPS[event.key];
    if (step === undefined) return;
    event.preventDefault();
    dispatch(setSidebarWidth.create({ width: step(sidebarWidth) }));
  };
  return html`<div
    class="app__resizer"
    role="separator"
    tabindex="0"
    aria-orientation="vertical"
    aria-label=${COPY.shell.resizeSidebar}
    aria-valuenow=${sidebarWidth}
    aria-valuemin=${SIDEBAR_WIDTH.min}
    aria-valuemax=${SIDEBAR_WIDTH.max}
    @pointerdown=${capturePointer}
    @pointermove=${previewWidth}
    @pointerup=${onPointerUp}
    @keydown=${onKeyDown}
  ></div>`;
}

function renderSidebarPanel(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  return html`<nav class="app__sidebar" aria-label=${COPY.shell.pagesLabel}>
    <header class="app__sidebar-header">
      <span class="app__product">
        <span class="app__badge" aria-hidden="true"
          >${PRODUCT_NAME.slice(0, 1)}</span
        >
        ${PRODUCT_NAME}
      </span>
      ${renderButton({
        label: COPY.sidebar.newPage,
        icon: "compose",
        isIconOnly: true,
        onClick: () => dispatch(createPage.create({ parentId: null })),
      })}
      ${renderButton({
        label: COPY.shell.hideSidebar,
        icon: "sidebar",
        isIconOnly: true,
        onClick: () => dispatch(toggleSidebar.create({})),
      })}
    </header>
    ${renderSidebar(state, dispatch)} ${renderResizer(state, dispatch)}
  </nav>`;
}

function renderActivePageMenu(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const pageId = state.ui.activePageId;
  if (pageId === null) return nothing;
  return renderPageMenuButton({ place: "bar", pageId, state, dispatch });
}

function renderTopBar(state: AppState, dispatch: Dispatch): TemplateResult {
  const showSidebar = renderButton({
    label: COPY.shell.showSidebar,
    icon: "sidebar",
    isIconOnly: true,
    onClick: () => dispatch(toggleSidebar.create({})),
  });
  return html`<header class="app__top-bar">
    ${state.ui.isSidebarCollapsed ? showSidebar : nothing}
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

export function renderShell(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const { isSidebarCollapsed, sidebarWidth } = state.ui;
  return html`<div
    class="app"
    ?data-sidebar-collapsed=${isSidebarCollapsed}
    ${ref((shell) => {
      setWidth(shell, sidebarWidth);
    })}
  >
    <a class="app__skip-link" href="#main">${COPY.shell.skipToContent}</a>
    ${isSidebarCollapsed ? nothing : renderSidebarPanel(state, dispatch)}
    <main class="app__main" id="main" tabindex="-1">
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
  </div>`;
}
