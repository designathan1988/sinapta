// A discussion, as Notion shows it: what it is about, each comment with
// its author, time and text, a reply field, and its resolve button; and a
// field that starts one.
import "./comments.css";
import "./reactions.css";
import { html, nothing, type TemplateResult } from "lit-html";
import type { Discussion, PageBlock } from "../../blocks/page/index.ts";
import type { BlockId, CommentRange } from "../../model/index.ts";
import type { Dispatch, OpenOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { focusOnce } from "../../ui/focus/index.ts";
import { ref } from "lit-html/directives/ref.js";
import {
  replyToDiscussion,
  resolveDiscussion,
  startDiscussion,
  type ValueAbout,
} from "./comment.commands.ts";
import { commentTime } from "./comments.selectors.ts";
import { renderCommentDelete } from "./comment-delete.view.ts";
import { renderAddReaction, renderReactions } from "./reactions.view.ts";

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

export interface DiscussionContext {
  readonly page: PageBlock;
  readonly dispatch: Dispatch;
  readonly now: string;
  // The name of the property a value discussion is about.
  readonly propertyName?: string;
  // The open overlay, for the question a comment's delete asks.
  readonly overlay?: OpenOverlay | null;
}

// What the discussion is about: the quoted text, or as Notion's, the
// property's name, a colon and the value as it read then.
function renderQuote(
  discussion: Discussion,
  context: DiscussionContext,
): TemplateResult | typeof nothing {
  const { quote } = discussion;
  if (quote === undefined) return nothing;
  if (discussion.propertyId === undefined)
    return html`<blockquote class="comments__quote">${quote}</blockquote>`;
  return html`<p class="comments__value">
    <span class="comments__value-name">${context.propertyName ?? ""}</span
    ><span aria-hidden="true">:</span>
    <span class="comments__value-text">${quote}</span>
  </p>`;
}

// A comment: its author's initial and name, its time and text, and a
// button that deletes it.
function renderComment(
  comment: Discussion["comments"][number],
  context: DiscussionContext,
  discussion: Discussion,
): TemplateResult {
  const target = { pageId: context.page.id, discussionId: discussion.id };
  const reaction = {
    pageId: context.page.id,
    discussion,
    comment,
    dispatch: context.dispatch,
    overlay: context.overlay ?? null,
  };
  // A value's discussion quotes the value in its first comment, under the
  // author, as Notion's.
  const isFirst = discussion.comments[0]?.id === comment.id;
  const quote =
    isFirst && discussion.propertyId !== undefined
      ? renderQuote(discussion, context)
      : nothing;
  return html`<li class="comments__comment">
    ${renderAvatar()}
    <div class="comments__body">
      <p class="comments__meta">
        <strong>${TEXT.author}</strong>
        <time datetime=${comment.createdAt}
          >${commentTime(comment.createdAt, context.now)}</time
        >
      </p>
      ${quote}
      ${comment.text === "" ? nothing : html`<p class="comments__text">${comment.text}</p>`}
      ${renderReactions(reaction)}
    </div>
    ${renderAddReaction(reaction)}
    ${renderCommentDelete(context.overlay ?? null, context.dispatch, {
      ...target,
      commentId: comment.id,
    })}
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
      ${discussion.propertyId === undefined ? renderQuote(discussion, context) : nothing}
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
        renderComment(comment, context, discussion),
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
  readonly value?: ValueAbout;
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
