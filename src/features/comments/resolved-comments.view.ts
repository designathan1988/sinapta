// A page's resolved discussions, as Notion's "Resolved" comments: each with
// the text it was about and its comments, to read or to reopen.
import { html, type TemplateResult, nothing } from "lit-html";
import { selectPage } from "../../blocks/page/index.ts";
import { parseBlockId, type BlockId } from "../../model/index.ts";
import {
  closeOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderDialog } from "../../ui/dialog/index.ts";
import { resolveDiscussion } from "./comment.commands.ts";
import {
  commentTime,
  selectResolvedDiscussions,
} from "./comments.selectors.ts";
import type { Discussion } from "../../blocks/page/index.ts";

export const RESOLVED_COMMENTS_OVERLAY = "resolved-comments";

const TEXT = COPY.comments;

// A comment as it was written, to read.
function renderReadOnly(
  comment: Discussion["comments"][number],
  now: string,
): TemplateResult {
  return html`<li class="comments__comment">
    <div class="comments__body">
      <p class="comments__meta">
        <strong>${TEXT.author}</strong>
        <time datetime=${comment.createdAt}
          >${commentTime(comment.createdAt, now)}</time
        >
      </p>
      <p class="comments__text">${comment.text}</p>
    </div>
  </li>`;
}

function renderResolved(
  discussion: Discussion,
  pageId: BlockId,
  dispatch: Dispatch,
): TemplateResult {
  const now = new Date().toISOString();
  const reopen = (): void => {
    const target = { pageId, discussionId: discussion.id };
    dispatch(resolveDiscussion.create({ ...target, isResolved: false }));
  };
  return html`<article class="comments__discussion">
    <div class="comments__head">
      ${
        discussion.quote === undefined
          ? nothing
          : html`<blockquote class="comments__quote">
              ${discussion.quote}
            </blockquote>`
      }
      <button type="button" class="button comments__reopen" @click=${reopen}>
        ${TEXT.reopen}
      </button>
    </div>
    <ul class="comments__list">
      ${discussion.comments.map((comment) => renderReadOnly(comment, now))}
    </ul>
  </article>`;
}

export function renderResolvedComments(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const pageId = parseBlockId(state.ui.overlay?.anchorId ?? "");
  const page = selectPage(state, pageId ?? null);
  if (page === undefined) return nothing;
  const resolved = selectResolvedDiscussions(state, page.id);
  return renderDialog({
    title: TEXT.resolved,
    closeLabel: TEXT.closeResolved,
    content: html`<div class="comments comments--resolved">
      ${
        resolved.length === 0
          ? html`<p class="comments__empty">${TEXT.noResolved}</p>`
          : resolved.map((item) => renderResolved(item, page.id, dispatch))
      }
    </div>`,
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
