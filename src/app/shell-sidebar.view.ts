// The sidebar beside the page, with its resizer, or on a narrow window
// a drawer over it.
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { renderSidebar } from "../features/sidebar/index.ts";
import {
  selectIsSidebarShown,
  setSidebarWidth,
  SIDEBAR_WIDTH,
  toggleSidebar,
  type AppState,
  type Dispatch,
} from "../state/index.ts";
import { COPY } from "../ui/copy.ts";
import { focusOnce } from "../ui/focus/index.ts";
import { setWidth, widthAt } from "./sidebar-width.ts";

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

// On a narrow window the sidebar is a drawer over the page: it takes the
// focus as it opens, and Escape or a press beside it closes it and gives
// the focus back to the button that opened it.
function closeDrawer(dispatch: Dispatch): void {
  dispatch(toggleSidebar.create({}));
  document.querySelector<HTMLElement>("[data-sidebar-open] button")?.focus();
}

export function renderSidebarPanel(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  if (!selectIsSidebarShown(state)) return nothing;
  const { isNarrow } = state.ui;
  const onKeyDown = (event: KeyboardEvent): void => {
    if (!isNarrow || event.key !== "Escape" || event.defaultPrevented) return;
    event.preventDefault();
    closeDrawer(dispatch);
  };
  const scrim = html`<div
    class="app__scrim"
    @click=${() => {
      closeDrawer(dispatch);
    }}
  ></div>`;
  return html`${isNarrow ? scrim : nothing}
    <nav
      class="app__sidebar"
      aria-label=${COPY.shell.pagesLabel}
      tabindex="-1"
      ${isNarrow ? ref(focusOnce) : nothing}
      @keydown=${onKeyDown}
    >
      ${renderSidebar(state, dispatch)}
      ${isNarrow ? nothing : renderResizer(state, dispatch)}
    </nav>`;
}
