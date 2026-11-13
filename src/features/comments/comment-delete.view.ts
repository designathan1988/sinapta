// A comment's delete button, and the question it asks first, as Notion's:
// "Delete this comment?" with Delete and Cancel, over the discussions.
// In a popover the question is one of its lists, so the discussions stay;
// under a page's title it is an overlay of its own.
import { html, nothing, type TemplateResult } from "lit-html";
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
import { renderConfirm } from "../../ui/confirm/index.ts";
import { childIndexOf } from "../../ui/overlay/index.ts";
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

function renderQuestion(
  target: CommentTarget,
  dispatch: Dispatch,
  isChild: boolean,
): TemplateResult {
  return renderConfirm({
    question: TEXT.confirmDelete,
    answer: TEXT.deleteAction,
    cancel: TEXT.cancel,
    isChild,
    onAnswer: () => dispatch(deleteComment.create(target)),
    onCancel: () => {
      dispatch(
        isChild
          ? closeChildOverlay.create({ depth: 0 })
          : closeOverlay.create({}),
      );
    },
  });
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
