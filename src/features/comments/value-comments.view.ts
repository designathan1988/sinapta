// Discussions about a database row's property value, as Notion's: the
// composer that starts one from the value's cell, and the popover that
// lists them from the cell or from the property on the row's page.
import "./value-comments.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type { BlockId, PropertyId } from "../../model/index.ts";
import {
  closeOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  focusOverlayAnchor,
  showPopoverWhenConnected,
} from "../../ui/overlay/index.ts";
import { closeOnEscape } from "./comment-popovers.view.ts";
import { selectValueDiscussions } from "./comments.selectors.ts";
import { renderDiscussion, renderNewDiscussion } from "./comments.view.ts";

export const VALUE_COMPOSER_OVERLAY = "value-comment-composer";
export const VALUE_DISCUSSIONS_OVERLAY = "value-discussions";

// The value a discussion is about: its row and property, the property's
// name, and the value as it reads now.
export interface ValueTarget {
  readonly rowId: BlockId;
  readonly propertyId: PropertyId;
  readonly propertyName: string;
  readonly quote: string;
}

// The overlay anchor of a value: the same key as its table cell.
export function valueAnchorId(rowId: BlockId, propertyId: PropertyId): string {
  return `${rowId}:${propertyId}`;
}

function closeAndReturn(dispatch: Dispatch): () => void {
  return () => {
    focusOverlayAnchor();
    dispatch(closeOverlay.create({}));
  };
}

function renderComposer(
  target: ValueTarget,
  dispatch: Dispatch,
): TemplateResult {
  const about = {
    pageId: target.rowId,
    blockId: null,
    value: { propertyId: target.propertyId, quote: target.quote },
  };
  return html`<div
    class="comments__popover"
    data-composer
    popover="manual"
    data-overlay
    aria-label=${COPY.database.commentOnValue}
    ${ref(showPopoverWhenConnected)}
    @keydown=${closeOnEscape(dispatch)}
  >
    ${renderNewDiscussion(about, dispatch, closeAndReturn(dispatch))}
  </div>`;
}

function renderDiscussions(
  state: AppState,
  target: ValueTarget,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const found = selectValueDiscussions(state, target.rowId, target.propertyId);
  if (found === undefined || found.discussions.length === 0) return nothing;
  const context = {
    page: found.page,
    dispatch,
    now: new Date().toISOString(),
    propertyName: target.propertyName,
    overlay: state.ui.overlay,
  };
  return html`<div
    class="comments__popover"
    data-discussions
    popover="manual"
    data-overlay
    aria-label=${COPY.comments.label}
    ${ref(showPopoverWhenConnected)}
    @keydown=${closeOnEscape(dispatch)}
  >
    ${found.discussions.map((item) => renderDiscussion(item, context))}
  </div>`;
}

// The open value overlay of this value, if one is open for it.
export function renderValueComments(
  state: AppState,
  dispatch: Dispatch,
  target: ValueTarget,
): TemplateResult | typeof nothing {
  const { overlay } = state.ui;
  if (overlay?.anchorId !== valueAnchorId(target.rowId, target.propertyId))
    return nothing;
  if (overlay.kind === VALUE_COMPOSER_OVERLAY)
    return renderComposer(target, dispatch);
  if (overlay.kind === VALUE_DISCUSSIONS_OVERLAY)
    return renderDiscussions(state, target, dispatch);
  return nothing;
}
