// Repositioning an image cover: while it is on, the cover is a slider that
// moves the image by dragging or with the arrow keys. The pointer position
// belongs to the browser during a drag; the store learns the end position.
import { html, type TemplateResult } from "lit-html";
import { setCoverPosition, type PageBlock } from "../../blocks/page/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";

export const COVER_POSITION_OVERLAY = "cover-position";

const STEP = 5;
const PAGE_STEP = 25;
const CENTER = 50;

export function coverPositionOf(page: PageBlock): number {
  return page.props.coverPosition ?? CENTER;
}

export function isRepositioning(state: AppState): boolean {
  return state.ui.overlay?.kind === COVER_POSITION_OVERLAY;
}

// Down shows more of the bottom of the image, up more of its top.
function nextPosition(key: string, current: number): number | undefined {
  const steps: Readonly<Record<string, number>> = {
    ArrowDown: current + STEP,
    ArrowRight: current + STEP,
    ArrowUp: current - STEP,
    ArrowLeft: current - STEP,
    PageDown: current + PAGE_STEP,
    PageUp: current - PAGE_STEP,
    Home: 0,
    End: 100,
  };
  return steps[key];
}

function clamp(position: number): number {
  return Math.min(100, Math.max(0, Math.round(position)));
}

// Shows the image at a position without a render, while it is dragged.
function preview(element: HTMLElement, position: number): void {
  element.dataset.position = String(position);
  element.style.setProperty("--editor-cover-y", `${String(position)}%`);
}

// Dragging the image down brings its top into view.
function positionAt(element: HTMLElement, clientY: number): number {
  const startY = Number(element.dataset.dragStartY);
  const start = Number(element.dataset.dragStart);
  const height = element.getBoundingClientRect().height || 1;
  return clamp(start - ((clientY - startY) / height) * 100);
}

export interface CoverSliderHandlers {
  readonly onKeyDown: (event: KeyboardEvent) => void;
  readonly onPointerDown: (event: PointerEvent) => void;
  readonly onPointerMove: (event: PointerEvent) => void;
  readonly onPointerUp: (event: PointerEvent) => void;
}

export function coverSliderHandlers(
  page: PageBlock,
  dispatch: Dispatch,
): CoverSliderHandlers {
  const save = (position: number): void => {
    dispatch(setCoverPosition.create({ pageId: page.id, position }));
  };
  return {
    onKeyDown(event) {
      const next = nextPosition(event.key, coverPositionOf(page));
      if (next === undefined) return;
      event.preventDefault();
      save(clamp(next));
    },
    onPointerDown(event) {
      if (!(event.currentTarget instanceof HTMLElement)) return;
      const element = event.currentTarget;
      element.setPointerCapture(event.pointerId);
      element.dataset.dragStartY = String(event.clientY);
      element.dataset.dragStart = String(coverPositionOf(page));
    },
    onPointerMove(event) {
      const element = event.currentTarget;
      if (!(element instanceof HTMLElement)) return;
      if (!element.hasPointerCapture(event.pointerId)) return;
      preview(element, positionAt(element, event.clientY));
    },
    onPointerUp(event) {
      const element = event.currentTarget;
      if (!(element instanceof HTMLElement)) return;
      if (!element.hasPointerCapture(event.pointerId)) return;
      element.releasePointerCapture(event.pointerId);
      save(positionAt(element, event.clientY));
      // From here the store's position, set on the cover, applies again.
      element.style.removeProperty("--editor-cover-y");
    },
  };
}

// "Reposition" before, "Save position" and a hint while repositioning.
export function renderRepositionControls(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  if (!isRepositioning(state)) {
    return renderButton({
      label: COPY.cover.reposition,
      variant: "quiet",
      onClick: () =>
        dispatch(
          openOverlay.create({ overlay: { kind: COVER_POSITION_OVERLAY } }),
        ),
    });
  }
  return html`<span class="editor__cover-hint"
      >${COPY.cover.repositionHint}</span
    >${renderButton({
      label: COPY.cover.savePosition,
      onClick: () => dispatch(closeOverlay.create({})),
    })}`;
}
