import "./column.css";
import { html, type TemplateResult } from "lit-html";
import type { AppState, Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { resizeColumns } from "./column.commands.ts";
import { shareOf } from "./column-share.ts";
import type { ColumnBlock } from "./column.schema.ts";

const STEP = 0.05;
const COLUMN = ".editor__block";
const SHARE_PROPERTY = "--column-share";

const KEY_STEPS: Readonly<Record<string, number>> = {
  ArrowLeft: -STEP,
  ArrowRight: STEP,
};

interface Boundary {
  readonly listId: ColumnBlock["parentId"];
  // The index of the column before the boundary.
  readonly index: number;
  // That column's share now.
  readonly share: number;
}

// The share the pointer asks for: from the left edge of the column before
// the boundary to the pointer, as a part of the whole row.
function shareAt(event: PointerEvent): number | undefined {
  const column =
    event.currentTarget instanceof Element
      ? event.currentTarget.closest(COLUMN)
      : null;
  const previous = column?.previousElementSibling;
  const row = column?.parentElement;
  if (!(previous instanceof HTMLElement) || !row) return undefined;
  const left = previous.getBoundingClientRect().left;
  return (
    (event.clientX - left) / Math.max(1, row.getBoundingClientRect().width)
  );
}

function handlers(boundary: Boundary, dispatch: Dispatch) {
  const resize = (share: number): void => {
    const { listId, index } = boundary;
    if (listId === null) return;
    dispatch(resizeColumns.create({ blockId: listId, index, share }));
  };
  return {
    onKeyDown: (event: KeyboardEvent): void => {
      const step = KEY_STEPS[event.key];
      if (step === undefined) return;
      event.preventDefault();
      resize(Math.round((boundary.share + step) * 100) / 100);
    },
    onPointerDown: (event: PointerEvent): void => {
      if (!(event.currentTarget instanceof Element)) return;
      event.preventDefault();
      event.currentTarget.setPointerCapture(event.pointerId);
    },
    // While dragging, the previous column shows the new share; the store
    // gets it once, on release.
    onPointerMove: (event: PointerEvent): void => {
      const target = event.currentTarget;
      const share = shareAt(event);
      if (!(target instanceof Element) || share === undefined) return;
      if (!target.hasPointerCapture(event.pointerId)) return;
      const previous = target.closest(COLUMN)?.previousElementSibling;
      if (previous instanceof HTMLElement) {
        previous.style.setProperty(SHARE_PROPERTY, String(share));
      }
    },
    onPointerUp: (event: PointerEvent): void => {
      const share = shareAt(event);
      if (share !== undefined) resize(share);
    },
  };
}

// A column shows a bar at its start that moves the boundary with the
// column before it; the first column has none.
export function renderColumn(
  block: ColumnBlock,
  dispatch: Dispatch,
  state: AppState,
): TemplateResult | undefined {
  const list =
    block.parentId === null
      ? undefined
      : state.workspace.blocks[block.parentId];
  const index = list?.childIds.indexOf(block.id) ?? -1;
  const previous =
    state.workspace.blocks[list?.childIds[index - 1] ?? block.id];
  if (list === undefined || index < 1 || previous === undefined) {
    return undefined;
  }
  const share = shareOf(previous, list.childIds.length);
  const on = handlers({ listId: list.id, index: index - 1, share }, dispatch);
  return html`<div
    class="column__gutter"
    role="separator"
    tabindex="0"
    aria-orientation="vertical"
    aria-label=${COPY.columns.resize}
    aria-valuenow=${Math.round(share * 100)}
    aria-valuemin="10"
    aria-valuemax="90"
    @keydown=${on.onKeyDown}
    @pointerdown=${on.onPointerDown}
    @pointermove=${on.onPointerMove}
    @pointerup=${on.onPointerUp}
  ></div>`;
}
