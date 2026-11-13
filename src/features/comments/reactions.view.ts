// A comment's reactions, as Notion's: each emoji the owner reacted with
// as a chip that takes it away, and "Add reaction", which shows while the
// comment is pointed at and opens the emoji picker.
import { html, nothing, type TemplateResult } from "lit-html";
import type { Discussion } from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import {
  openOverlay,
  type Dispatch,
  type OpenOverlay,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { REACTION_OVERLAY } from "./reaction-picker.view.ts";
import { toggleReaction } from "./reaction.commands.ts";

const TEXT = COPY.comments;

export interface ReactionTarget {
  readonly pageId: BlockId;
  readonly discussion: Discussion;
  readonly comment: Discussion["comments"][number];
  readonly dispatch: Dispatch;
  readonly overlay: OpenOverlay | null;
}

export function renderAddReaction(target: ReactionTarget): TemplateResult {
  const { comment, discussion, pageId, dispatch, overlay } = target;
  const isOpen =
    overlay?.kind === REACTION_OVERLAY && overlay.anchorId === comment.id;
  const next = {
    kind: REACTION_OVERLAY,
    anchorId: comment.id,
    values: { page: [pageId], discussion: [discussion.id] },
  };
  return html`<button
    type="button"
    class="comments__add-reaction"
    data-overlay-anchor
    aria-haspopup="dialog"
    aria-expanded=${String(isOpen)}
    aria-label=${TEXT.addReaction}
    title=${TEXT.addReaction}
    @click=${() => dispatch(openOverlay.create({ overlay: next }))}
  >
    ${renderIcon("smile")}
  </button>`;
}

export function renderReactions(
  target: ReactionTarget,
): TemplateResult | typeof nothing {
  const { comment, discussion, dispatch } = target;
  const reactions = comment.reactions ?? [];
  if (reactions.length === 0) return nothing;
  return html`<div class="comments__reactions">
    ${reactions.map(
      (emoji) =>
        html`<button
          type="button"
          class="comments__reaction"
          aria-pressed="true"
          aria-label=${`${TEXT.removeReaction} ${emoji}`}
          @click=${() =>
            dispatch(
              toggleReaction.create({
                pageId: target.pageId,
                discussionId: discussion.id,
                commentId: comment.id,
                emoji,
              }),
            )}
        >
          <span aria-hidden="true">${emoji}</span> 1
        </button>`,
    )}
  </div>`;
}
