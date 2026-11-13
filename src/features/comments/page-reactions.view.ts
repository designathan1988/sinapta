// A page's own reactions, as on Notion's feed cards: the emoji the owner
// reacted to the page with, each a chip that takes it away, then a button
// that opens the emoji picker. They are kept as a discussion on the page
// whose one comment is the reactions alone.
import { html, type TemplateResult } from "lit-html";
import { selectPage, type Discussion } from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import {
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { REACTION_OVERLAY } from "./reaction-picker.view.ts";
import { toggleReaction } from "./reaction.commands.ts";

const TEXT = COPY.comments;

// The page's reactions discussion: on the page itself, one comment of
// reactions alone.
export function selectPageReactions(
  state: AppState,
  pageId: BlockId,
):
  | { discussion: Discussion; comment: Discussion["comments"][number] }
  | undefined {
  const discussions = selectPage(state, pageId)?.props.discussions ?? [];
  for (const discussion of discussions) {
    const comment = discussion.comments[0];
    const isPageOwn =
      discussion.blockId === null && discussion.propertyId === undefined;
    if (isPageOwn && !discussion.isResolved && comment?.text === "") {
      return { discussion, comment };
    }
  }
  return undefined;
}

type PageReactions = ReturnType<typeof selectPageReactions>;

function renderChips(
  found: PageReactions,
  dispatch: Dispatch,
  pageId: BlockId,
): TemplateResult[] {
  if (found === undefined) return [];
  const { discussion, comment } = found;
  return (comment.reactions ?? []).map(
    (emoji) =>
      html`<button
        type="button"
        class="comments__reaction"
        aria-pressed="true"
        aria-label=${`${TEXT.removeReaction} ${emoji}`}
        @click=${() =>
          dispatch(
            toggleReaction.create({
              pageId,
              discussionId: discussion.id,
              commentId: comment.id,
              emoji,
            }),
          )}
      >
        <span aria-hidden="true">${emoji}</span> 1
      </button>`,
  );
}

export function renderPageReactions(
  state: AppState,
  dispatch: Dispatch,
  pageId: BlockId,
): TemplateResult {
  const found = selectPageReactions(state, pageId);
  const { overlay } = state.ui;
  const isOpen =
    overlay?.kind === REACTION_OVERLAY && overlay.anchorId === pageId;
  const next = {
    kind: REACTION_OVERLAY,
    anchorId: pageId,
    values: { target: ["page"] },
  };
  return html`<div class="comments__reactions" data-page>
    ${renderChips(found, dispatch, pageId)}
    <button
      type="button"
      class="comments__add-reaction"
      data-overlay-anchor
      aria-haspopup="dialog"
      aria-expanded=${String(isOpen)}
      aria-label=${TEXT.addReaction}
      title=${TEXT.addReaction}
      @click=${() => dispatch(openOverlay.create({ overlay: next }))}
    >
      ${renderIcon("add-reaction")}
    </button>
  </div>`;
}
