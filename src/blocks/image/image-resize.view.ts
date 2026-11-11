// Handles on both sides of an image change its width: dragged, or with
// the arrow keys on the one that takes focus. While dragging, the browser
// owns the width; the store gets it once, on release.
import { html, type TemplateResult } from "lit-html";
import type { Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { setImageWidth } from "./image.commands.ts";
import {
  IMAGE_WIDTH,
  type ImageAlign,
  type ImageBlock,
} from "./image.schema.ts";

const WIDTH_PROPERTY = "--image-width";
const FIGURE = ".image";

export function setImageWidthProperty(
  element: Element | undefined,
  width: number,
): void {
  if (element instanceof HTMLElement) {
    element.style.setProperty(WIDTH_PROPERTY, `${String(width)}%`);
  }
}

function clampWidth(width: number): number {
  return Math.min(IMAGE_WIDTH.max, Math.max(IMAGE_WIDTH.min, width));
}

// The width the pointer asks for, as a percent of the figure: measured
// from the side the image is aligned to, or from its middle when centered.
function widthAt(event: PointerEvent, figure: Element, align: ImageAlign) {
  const box = figure.getBoundingClientRect();
  const middle = box.left + box.width / 2;
  const spans = {
    left: event.clientX - box.left,
    center: 2 * Math.abs(event.clientX - middle),
    right: box.right - event.clientX,
  };
  return clampWidth((spans[align] / Math.max(1, box.width)) * 100);
}

const KEY_STEPS: Readonly<Record<string, (width: number) => number>> = {
  ArrowLeft: (width) => width - IMAGE_WIDTH.step,
  ArrowDown: (width) => width - IMAGE_WIDTH.step,
  ArrowRight: (width) => width + IMAGE_WIDTH.step,
  ArrowUp: (width) => width + IMAGE_WIDTH.step,
  Home: () => IMAGE_WIDTH.min,
  End: () => IMAGE_WIDTH.max,
};

function handlers(block: ImageBlock, dispatch: Dispatch) {
  const blockId = block.id;
  const width = block.props.width ?? IMAGE_WIDTH.max;
  const align = block.props.align ?? "center";
  const figureOf = (event: Event) =>
    event.currentTarget instanceof Element
      ? event.currentTarget.closest(FIGURE)
      : null;
  return {
    onPointerDown: (event: PointerEvent): void => {
      if (!(event.currentTarget instanceof Element)) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    onPointerMove: (event: PointerEvent): void => {
      const target = event.currentTarget;
      const figure = figureOf(event);
      if (!(target instanceof Element) || figure === null) return;
      if (!target.hasPointerCapture(event.pointerId)) return;
      setImageWidthProperty(figure, widthAt(event, figure, align));
    },
    onPointerUp: (event: PointerEvent): void => {
      const figure = figureOf(event);
      if (figure === null) return;
      const next = widthAt(event, figure, align);
      dispatch(setImageWidth.create({ blockId, width: next }));
    },
    onKeyDown: (event: KeyboardEvent): void => {
      const step = KEY_STEPS[event.key];
      if (step === undefined) return;
      event.preventDefault();
      const next = clampWidth(step(width));
      dispatch(setImageWidth.create({ blockId, width: next }));
    },
  };
}

export function renderWidthHandles(
  block: ImageBlock,
  dispatch: Dispatch,
): TemplateResult {
  const width = block.props.width ?? IMAGE_WIDTH.max;
  const on = handlers(block, dispatch);
  return html`<div
      class="image__handle"
      data-side="start"
      aria-hidden="true"
      @pointerdown=${on.onPointerDown}
      @pointermove=${on.onPointerMove}
      @pointerup=${on.onPointerUp}
    ></div>
    <div
      class="image__handle"
      data-side="end"
      role="slider"
      tabindex="0"
      aria-label=${COPY.imageBlock.width}
      aria-valuemin=${IMAGE_WIDTH.min}
      aria-valuemax=${IMAGE_WIDTH.max}
      aria-valuenow=${width}
      aria-valuetext=${`${String(width)} ${COPY.imageBlock.widthValue}`}
      @pointerdown=${on.onPointerDown}
      @pointermove=${on.onPointerMove}
      @pointerup=${on.onPointerUp}
      @keydown=${on.onKeyDown}
    ></div>`;
}
