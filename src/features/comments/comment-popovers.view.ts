// Where comments show: under a page's title, the page's discussions; by
// a block, a count of its discussions that opens them; and the popover
// that starts a discussion on a block or on selected text.
import { html, nothing, type TemplateResult } from "lit-html";
import type { PageBlock } from "../../blocks/page/index.ts";
import { parseBlockId, type BlockId } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY, pluralize } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import { ref } from "lit-html/directives/ref.js";
import { selectOpenDiscussions, selectPageOf } from "./comments.selectors.ts";
import { startDiscussion } from "./comment.commands.ts";
import {
  renderCommentField,
  renderDiscussion,
  renderNewDiscussion,
  type NewDiscussion,
} from "./comments.view.ts";

export const COMMENT_COMPOSER_OVERLAY = "comment-composer";
export const DISCUSSIONS_OVERLAY = "discussions";

const TEXT = COPY.comments;

const now = (): string => new Date().toISOString();

// The page's own discussions, and the field that starts one when asked.
export function renderPageDiscussions(
  state: AppState,
  dispatch: Dispatch,
  page: PageBlock,
): TemplateResult | typeof nothing {
  const found = selectOpenDiscussions(state, page.id);
  const { overlay } = state.ui;
  const isAdding =
    overlay?.kind === COMMENT_COMPOSER_OVERLAY && overlay.anchorId === page.id;
  const discussions = found?.discussions ?? [];
  if (discussions.length === 0 && !isAdding) return nothing;
  const context = { page, dispatch, now: now() };
  const close = (): void => {
    dispatch(closeOverlay.create({}));
  };
  return html`<section class="comments" aria-label=${TEXT.label}>
    ${discussions.map((item) => renderDiscussion(item, context))}
    ${
      isAdding || discussions.length > 0
        ? renderNewDiscussion(
            { pageId: page.id, blockId: null },
            dispatch,
            close,
          )
        : nothing
    }
  </section>`;
}

// A database row's discussions, under its properties as Notion's: its
// comments, then a field that is always there to start one. It takes
// focus only when asked for, by "Add comment".
export function renderRowDiscussions(
  state: AppState,
  dispatch: Dispatch,
  page: PageBlock,
): TemplateResult {
  const found = selectOpenDiscussions(state, page.id);
  const { overlay } = state.ui;
  const isAdding =
    overlay?.kind === COMMENT_COMPOSER_OVERLAY && overlay.anchorId === page.id;
  const context = { page, dispatch, now: now() };
  const start = (text: string): void => {
    dispatch(startDiscussion.create({ pageId: page.id, blockId: null, text }));
  };
  return html`<section class="comments" data-row aria-label=${TEXT.label}>
    ${(found?.discussions ?? []).map((item) => renderDiscussion(item, context))}
    ${renderCommentField(TEXT.add, start, isAdding)}
  </section>`;
}

// By a block with open discussions: a speech bubble and their count.
export function renderBlockComments(
  state: AppState,
  dispatch: Dispatch,
  blockId: BlockId,
): TemplateResult | typeof nothing {
  const found = selectOpenDiscussions(state, blockId);
  const count = found?.discussions.length ?? 0;
  if (found === undefined || count === 0 || found.page.id === blockId)
    return nothing;
  const overlay = { kind: DISCUSSIONS_OVERLAY, anchorId: blockId };
  const isOpen =
    state.ui.overlay?.kind === DISCUSSIONS_OVERLAY &&
    state.ui.overlay.anchorId === blockId;
  return html`<button
    type="button"
    class="comments__count"
    aria-label=${`${String(count)} ${pluralize(count, TEXT.count)}`}
    aria-expanded=${String(isOpen)}
    @click=${() =>
      dispatch(
        isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay }),
      )}
  >
    ${renderIcon("comment")} ${count}
  </button>`;
}

// Escape closes a comment popover; the text it was opened from takes the
// focus back.
function closeOnEscape(dispatch: Dispatch) {
  return (event: KeyboardEvent): void => {
    if (event.key !== "Escape") return;
    event.preventDefault();
    event.stopPropagation();
    dispatch(closeOverlay.create({}));
  };
}

// A block's open discussions, in a popover by the block.
export function renderDiscussionsPopover(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const blockId = parseBlockId(state.ui.overlay?.anchorId ?? "");
  const found =
    blockId === undefined ? undefined : selectOpenDiscussions(state, blockId);
  if (found === undefined || found.discussions.length === 0) return nothing;
  const context = { page: found.page, dispatch, now: now() };
  return html`<div
    class="comments__popover"
    popover="manual"
    data-overlay
    aria-label=${TEXT.label}
    ${ref(showPopoverWhenConnected)}
    @keydown=${closeOnEscape(dispatch)}
  >
    ${found.discussions.map((item) => renderDiscussion(item, context))}
  </div>`;
}

// What a new discussion from the composer is about: a block of a page,
// and the selected text in it, if any.
function composerTarget(state: AppState): NewDiscussion | undefined {
  const { overlay } = state.ui;
  const blockId = parseBlockId(overlay?.anchorId ?? "");
  if (overlay === null || blockId === undefined) return undefined;
  const page = selectPageOf(state, blockId);
  if (page === undefined || blockId === page.id) return undefined;
  const { start, end } = overlay;
  const hasRange = start !== undefined && end !== undefined && start !== end;
  return {
    pageId: page.id,
    blockId,
    ...(hasRange && { range: { start, end } }),
  };
}

// The popover that starts a discussion on a block or on its selected text.
export function renderComposerPopover(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const about = composerTarget(state);
  if (about === undefined) return nothing;
  return html`<div
    class="comments__popover"
    popover="manual"
    data-overlay
    aria-label=${TEXT.add}
    ${ref(showPopoverWhenConnected)}
    @keydown=${closeOnEscape(dispatch)}
  >
    ${renderNewDiscussion(about, dispatch, () =>
      dispatch(closeOverlay.create({})),
    )}
  </div>`;
}
