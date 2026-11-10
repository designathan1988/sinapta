import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import {
  renderSettings,
  SETTINGS_OVERLAY,
} from "../features/settings/index.ts";
import {
  openOverlay,
  setSidebarWidth,
  SIDEBAR_WIDTH,
  toggleSidebar,
  type AppState,
  type Dispatch,
} from "../state/index.ts";
import { renderButton } from "../ui/button/index.ts";
import { COPY, PRODUCT_NAME } from "../ui/copy.ts";

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

function capturePointer(event: PointerEvent): void {
  if (event.currentTarget instanceof Element) {
    event.currentTarget.setPointerCapture(event.pointerId);
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

function renderSidebar(dispatch: Dispatch): TemplateResult {
  return html`<nav class="app__sidebar" aria-label=${COPY.shell.pagesLabel}>
    <header class="app__sidebar-header">
      <span class="app__product">${PRODUCT_NAME}</span>
      ${renderButton({
        label: COPY.shell.hideSidebar,
        icon: "sidebar",
        isIconOnly: true,
        onClick: () => dispatch(toggleSidebar.create({})),
      })}
    </header>
    <p class="app__empty">${COPY.shell.emptyWorkspace}</p>
  </nav>`;
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
    <span class="app__spacer"></span>
    <span class="app__save-status" role="status"
      >${COPY.saveStatus[state.persistence.status]}</span
    >
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
  const { isSidebarCollapsed, sidebarWidth, overlay } = state.ui;
  return html`<div
    class="app"
    ?data-sidebar-collapsed=${isSidebarCollapsed}
    ${ref((shell) => {
      setWidth(shell, sidebarWidth);
    })}
  >
    <a class="app__skip-link" href="#main">${COPY.shell.skipToContent}</a>
    ${isSidebarCollapsed ? nothing : renderSidebar(dispatch)}
    ${isSidebarCollapsed ? nothing : renderResizer(state, dispatch)}
    <main class="app__main" id="main" tabindex="-1">
      ${renderTopBar(state, dispatch)}
      <div class="app__page"></div>
    </main>
    ${
      overlay?.kind === SETTINGS_OVERLAY
        ? renderSettings(state, dispatch)
        : nothing
    }
  </div>`;
}
