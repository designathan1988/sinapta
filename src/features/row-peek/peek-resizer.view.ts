// The side peek's edge, which drags it wider or narrower, as Notion's;
// the arrow keys move it a step, Home and End to its bounds. The width is
// a custom property on the shell, whose grid gives the peek its column.
import { html, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import {
  PEEK_WIDTH,
  setPeekWidth,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";

const WIDTH_PROPERTY = "--app-peek-width";

const KEY_STEPS: Readonly<Record<string, (width: number) => number>> = {
  ArrowLeft: (width) => width + PEEK_WIDTH.step,
  ArrowRight: (width) => width - PEEK_WIDTH.step,
  Home: () => PEEK_WIDTH.min,
  End: () => PEEK_WIDTH.max,
};

function setShellWidth(element: Element | undefined, width: number): void {
  const shell = element?.closest(".app");
  if (shell instanceof HTMLElement) {
    shell.style.setProperty(WIDTH_PROPERTY, `${String(width)}rem`);
  }
}

// The pointer's distance from the window's end, in rem.
function widthAt(event: PointerEvent): number {
  const rem = parseFloat(getComputedStyle(document.documentElement).fontSize);
  return (window.innerWidth - event.clientX) / rem;
}

// While dragging, the browser owns the width; the store gets it once.
function onPointerMove(event: PointerEvent): void {
  const target = event.currentTarget;
  if (target instanceof Element && target.hasPointerCapture(event.pointerId)) {
    setShellWidth(target, widthAt(event));
  }
}

function onPointerDown(event: PointerEvent): void {
  if (event.currentTarget instanceof Element) {
    event.currentTarget.setPointerCapture(event.pointerId);
  }
}

export function renderPeekResizer(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const { peekWidth } = state.ui;
  const onKeyDown = (event: KeyboardEvent): void => {
    const step = KEY_STEPS[event.key];
    if (step === undefined) return;
    event.preventDefault();
    event.stopPropagation();
    dispatch(setPeekWidth.create({ width: step(peekWidth) }));
  };
  return html`<div
    class="peek__resizer"
    role="separator"
    tabindex="0"
    aria-orientation="vertical"
    aria-label=${COPY.peek.resize}
    aria-valuenow=${peekWidth}
    aria-valuemin=${PEEK_WIDTH.min}
    aria-valuemax=${PEEK_WIDTH.max}
    ${ref((element) => {
      setShellWidth(element, peekWidth);
    })}
    @pointerdown=${onPointerDown}
    @pointermove=${onPointerMove}
    @pointerup=${(event: PointerEvent) =>
      dispatch(setPeekWidth.create({ width: widthAt(event) }))}
    @keydown=${onKeyDown}
  ></div>`;
}
