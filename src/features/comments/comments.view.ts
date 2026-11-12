// A discussion, as Notion shows it: what it is about, each comment with
// its author, time and text, a reply field, and its resolve button; and a
// field that starts one.
import "./comments.css";
import { html, nothing, type TemplateResult } from "lit-html";
import type { Discussion, PageBlock } from "../../blocks/page/index.ts";
import type { BlockId, CommentRange } from "../../model/index.ts";
import type { Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { focusOnce } from "../../ui/focus/index.ts";
import { ref } from "lit-html/directives/ref.js";
import {
  deleteComment,
  replyToDiscussion,
  resolveDiscussion,
  startDiscussion,
} from "./comment.commands.ts";
import { commentTime } from "./comments.selectors.ts";

const TEXT = COPY.comments;

// The text of a submitted field, which then empties.
function takeText(event: SubmitEvent): string {
  event.preventDefault();
  const form = event.currentTarget;
  if (!(form instanceof HTMLFormElement)) return "";
  const value = new FormData(form).get("comment");
  const text = typeof value === "string" ? value : "";
  form.reset();
  return text;
}

function renderAvatar(): TemplateResult {
  return html`<span class="comments__avatar" aria-hidden="true"
    >${TEXT.author.slice(0, 1)}</span
  >`;
}

// A field that sends what is typed with Enter or its arrow button.
export function renderCommentField(
  placeholder: string,
  onText: (text: string) => void,
  isFocused = false,
): TemplateResult {
  return html`<form
    class="comments__field"
    @submit=${(event: SubmitEvent) => {
      const text = takeText(event);
      if (text.trim() !== "") onText(text);
    }}
  >
    ${renderAvatar()}
    <input
      name="comment"
      type="text"
      autocomplete="off"
      aria-label=${placeholder}
      placeholder=${placeholder}
      ${isFocused ? ref(focusOnce) : nothing}
    />
    <button type="submit" class="comments__send" aria-label=${TEXT.send}>
      ${renderIcon("arrow-up-right")}
    </button>
  </form>`;
}

interface DiscussionContext {
  readonly page: PageBlock;
  readonly dispatch: Dispatch;
  readonly now: string;
}

// A comment: its author's initial and name, its time and text, and a
// button that deletes it.
function renderComment(
  comment: Discussion["comments"][number],
  context: DiscussionContext,
  discussionId: BlockId,
): TemplateResult {
  const target = { pageId: context.page.id, discussionId };
  return html`<li class="comments__comment">
    ${renderAvatar()}
    <div class="comments__body">
      <p class="comments__meta">
        <strong>${TEXT.author}</strong>
        <time datetime=${comment.createdAt}
          >${commentTime(comment.createdAt, context.now)}</time
        >
      </p>
      <p class="comments__text">${comment.text}</p>
    </div>
    <button
      type="button"
      class="comments__delete"
      aria-label=${TEXT.delete}
      title=${TEXT.delete}
      @click=${() =>
        context.dispatch(
          deleteComment.create({ ...target, commentId: comment.id }),
        )}
    >
      ${renderIcon("trash")}
    </button>
  </li>`;
}

export function renderDiscussion(
  discussion: Discussion,
  context: DiscussionContext,
): TemplateResult {
  const { page, dispatch } = context;
  const target = { pageId: page.id, discussionId: discussion.id };
  return html`<article
    class="comments__discussion"
    data-discussion-id=${discussion.id}
  >
    <div class="comments__head">
      ${
        discussion.quote === undefined
          ? nothing
          : html`<blockquote class="comments__quote">
              ${discussion.quote}
            </blockquote>`
      }
      <button
        type="button"
        class="comments__resolve"
        aria-label=${TEXT.resolve}
        title=${TEXT.resolve}
        @click=${() =>
          dispatch(resolveDiscussion.create({ ...target, isResolved: true }))}
      >
        ${renderIcon("check")}
      </button>
    </div>
    <ul class="comments__list">
      ${discussion.comments.map((comment) =>
        renderComment(comment, context, discussion.id),
      )}
    </ul>
    ${renderCommentField(TEXT.reply, (text) =>
      dispatch(replyToDiscussion.create({ ...target, text })),
    )}
  </article>`;
}

export interface NewDiscussion {
  readonly pageId: BlockId;
  readonly blockId: BlockId | null;
  readonly range?: CommentRange;
}

// The field that starts a discussion.
export function renderNewDiscussion(
  about: NewDiscussion,
  dispatch: Dispatch,
  onDone: () => void,
): TemplateResult {
  return renderCommentField(
    TEXT.add,
    (text) => {
      dispatch(startDiscussion.create({ ...about, text }));
      onDone();
    },
    true,
  );
}
