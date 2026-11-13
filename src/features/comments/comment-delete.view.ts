// A comment's delete button, and the question it asks first, as Notion's:
// "Delete this comment?" with Delete and Cancel, over the discussions.
// In a popover the question is one of its lists, so the discussions stay;
// under a page's title it is an overlay of its own.
import "./comment-delete.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type { BlockId } from "../../model/index.ts";
import {
  closeChildOverlay,
  closeOverlay,
  openChildOverlay,
  openOverlay,
  type Dispatch,
  type OpenOverlay,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import {
  childIndexOf,
  showPopoverWhenConnected,
} from "../../ui/overlay/index.ts";
import { deleteComment } from "./comment.commands.ts";

const TEXT = COPY.comments;

export interface CommentTarget {
  readonly pageId: BlockId;
  readonly discussionId: BlockId;
  readonly commentId: BlockId;
}

export const COMMENT_DELETE_OVERLAY = "comment-delete";

function deleteAnchor(commentId: BlockId): string {
  return `${COMMENT_DELETE_OVERLAY}:${commentId}`;
}

// Whether the question is open, and whether as a list of a popover.
function askingOf(
  overlay: OpenOverlay | null,
  anchorId: string,
): { readonly isAsking: boolean; readonly isChild: boolean } {
  const isOwn =
    overlay?.kind === COMMENT_DELETE_OVERLAY && overlay.anchorId === anchorId;
  const isChild = childIndexOf(overlay, anchorId) >= 0;
  return { isAsking: isOwn || isChild, isChild };
}

// Delete, which takes the comment away, then Cancel.
function renderAnswers(
  target: CommentTarget,
  dispatch: Dispatch,
  cancel: () => void,
): TemplateResult {
  return html`<button
      type="button"
      class="button"
      data-variant="danger"
      data-autofocus
      @click=${() => {
        cancel();
        dispatch(deleteComment.create(target));
      }}
    >
      <span>${TEXT.deleteAction}</span>
    </button>
    <button type="button" class="button" data-variant="quiet" @click=${cancel}>
      <span>${TEXT.cancel}</span>
    </button>`;
}

function renderQuestion(
  target: CommentTarget,
  dispatch: Dispatch,
  isChild: boolean,
): TemplateResult {
  const cancel = (): void => {
    dispatch(
      isChild
        ? closeChildOverlay.create({ depth: 0 })
        : closeOverlay.create({}),
    );
  };
  return html`<div
    class="comments__confirm"
    popover="manual"
    data-overlay
    ?data-child=${isChild}
    role="alertdialog"
    aria-label=${TEXT.confirmDelete}
    ${ref(showPopoverWhenConnected)}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      cancel();
    }}
  >
    <p class="comments__confirm-title">${TEXT.confirmDelete}</p>
    ${renderAnswers(target, dispatch, cancel)}
  </div>`;
}

// The button, then its question while it is asked.
export function renderCommentDelete(
  overlay: OpenOverlay | null,
  dispatch: Dispatch,
  target: CommentTarget,
): TemplateResult {
  const anchorId = deleteAnchor(target.commentId);
  const { isAsking, isChild } = askingOf(overlay, anchorId);
  const ask = (): void => {
    dispatch(
      overlay === null
        ? openOverlay.create({
            overlay: { kind: COMMENT_DELETE_OVERLAY, anchorId },
          })
        : openChildOverlay.create({ anchorId }),
    );
  };
  return html`<button
      type="button"
      class="comments__delete"
      data-overlay-child-anchor
      aria-haspopup="dialog"
      aria-expanded=${String(isAsking)}
      aria-label=${TEXT.delete}
      title=${TEXT.delete}
      @click=${ask}
    >
      ${renderIcon("trash")}
    </button>
    ${isAsking ? renderQuestion(target, dispatch, isChild) : nothing}`;
}
