// The top bar's comments button and the panel it opens, as Notion's
// "Discussions": a bell for the page's notification settings, the page's
// open discussions, or "You're all caught up" and View all, which lists
// the resolved ones too, to reopen.
import "./discussions-panel.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import {
  selectPage,
  type Discussion,
  type PageBlock,
} from "../../blocks/page/index.ts";
import { parseBlockId, type BlockId } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { resolveDiscussion } from "./comment.commands.ts";
import { renderDiscussionsBell } from "./discussions-bell.view.ts";
import { commentTime } from "./comments.selectors.ts";
import { renderResolved } from "./resolved-comments.view.ts";

export const DISCUSSIONS_PANEL_OVERLAY = "discussions-panel";
const ALL = "all";

const TEXT = COPY.comments;

export function renderCommentsButton(
  state: AppState,
  pageId: BlockId,
  dispatch: Dispatch,
): TemplateResult {
  const { overlay } = state.ui;
  const isOpen = overlay?.kind === DISCUSSIONS_PANEL_OVERLAY;
  const panel = { kind: DISCUSSIONS_PANEL_OVERLAY, anchorId: pageId };
  return html`<button
    type="button"
    class="page-info__action"
    aria-label=${TEXT.label}
    aria-expanded=${String(isOpen)}
    data-overlay-anchor
    title=${tooltipTitle(TEXT.label)}
    interestfor=${TOOLTIP_TARGET}
    @click=${() =>
      dispatch(
        isOpen
          ? closeOverlay.create({})
          : openOverlay.create({ overlay: panel }),
      )}
  >
    ${renderIcon("comment")}
  </button>`;
}

function renderComment(
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

function renderOpen(
  discussion: Discussion,
  pageId: BlockId,
  dispatch: Dispatch,
): TemplateResult {
  const now = new Date().toISOString();
  const resolve = (): void => {
    const target = { pageId, discussionId: discussion.id };
    dispatch(resolveDiscussion.create({ ...target, isResolved: true }));
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
      <button type="button" class="button comments__reopen" @click=${resolve}>
        ${TEXT.resolve}
      </button>
    </div>
    <ul class="comments__list">
      ${discussion.comments.map((comment) => renderComment(comment, now))}
    </ul>
  </article>`;
}

function renderCaughtUp(showAll: () => void): TemplateResult {
  return html`<div class="comments__caught-up">
    <span class="comments__caught-up-icon" aria-hidden="true"
      >${renderIcon("comment")}</span
    >
    <p class="comments__caught-up-title">${TEXT.allRead}</p>
    <p class="comments__caught-up-text">${TEXT.noOpen}</p>
    <button
      type="button"
      class="button"
      data-variant="outline"
      @click=${showAll}
    >
      ${TEXT.viewAll}
    </button>
  </div>`;
}

export function renderDiscussionsPanel(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const { overlay } = state.ui;
  if (overlay?.kind !== DISCUSSIONS_PANEL_OVERLAY) return nothing;
  const page = selectPage(state, parseBlockId(overlay.anchorId ?? "") ?? null);
  if (page === undefined) return nothing;
  const isAll = overlay.flags?.includes(ALL) === true;
  const showAll = (): void => {
    dispatch(openOverlay.create({ overlay: { ...overlay, flags: [ALL] } }));
  };
  return html`<div
    class="comments comments__panel"
    popover="manual"
    data-overlay
    role="dialog"
    aria-label=${TEXT.discussions}
    ${ref(showPopoverWhenConnected)}
  >
    <div class="comments__panel-head">
      <h2 class="comments__panel-title">${TEXT.discussions}</h2>
      ${renderDiscussionsBell(state, page, dispatch)}
    </div>
    ${renderBody(page, { isAll, showAll }, dispatch)}
  </div>`;
}

// The open discussions, and after View all the resolved ones too.
function renderBody(
  page: PageBlock,
  shown: { readonly isAll: boolean; readonly showAll: () => void },
  dispatch: Dispatch,
): TemplateResult {
  const all = (page.props.discussions ?? []).filter(
    (item) => item.propertyId === undefined,
  );
  const open = all.filter((item) => !item.isResolved);
  const resolved = shown.isAll ? all.filter((item) => item.isResolved) : [];
  if (open.length === 0 && resolved.length === 0) {
    return shown.isAll
      ? html`<p class="comments__empty">${TEXT.noOpen}</p>`
      : renderCaughtUp(shown.showAll);
  }
  return html`${open.map((item) => renderOpen(item, page.id, dispatch))}
  ${resolved.map((item) => renderResolved(item, page.id, dispatch))}`;
}
