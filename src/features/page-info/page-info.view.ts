// The top bar's page details, as Notion's: when the open page was last
// edited, which opens its history, a button that copies its link, and a
// star that adds it to or removes it from the favorites.
import { renderSuggesting } from "./page-info-suggesting.view.ts";
import "./page-info.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  selectPage,
  setPageLocked,
  togglePageFavorite,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import {
  openOverlay,
  PAGE_HISTORY_OVERLAY,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { linkToPage } from "../../ui/address/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY, countLabel } from "../../ui/copy.ts";
import { renderCommentsButton } from "../comments/index.ts";
import { writeSystemClipboard } from "../editor/index.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { selectEditedLabel, selectWordCount } from "./page-info.selectors.ts";

// "Locked", in the top bar of a locked page; it unlocks the page.
function renderLocked(
  page: PageBlock,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  if (page.props.isLocked !== true) return nothing;
  const pageId = page.id;
  return html`<button
    type="button"
    class="page-info__locked"
    title=${tooltipTitle(COPY.lock.unlock)}
    interestfor=${TOOLTIP_TARGET}
    @click=${() => dispatch(setPageLocked.create({ pageId, isLocked: false }))}
  >
    ${renderIcon("lock")} <span>${COPY.lock.locked}</span>
  </button>`;
}

// The page's address on the clipboard, as Notion's link button.
function renderCopyLink(pageId: BlockId): TemplateResult {
  return html`<button
    type="button"
    class="page-info__action"
    aria-label=${COPY.pageInfo.copyLink}
    title=${tooltipTitle(COPY.pageInfo.copyLink)}
    interestfor=${TOOLTIP_TARGET}
    @click=${() => {
      writeSystemClipboard(linkToPage(pageId));
      announce(COPY.shell.linkCopied);
    }}
  >
    ${renderIcon("link")}
  </button>`;
}

export function renderPageInfo(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const page = selectPage(state, state.ui.activePageId);
  if (page === undefined || page.props.isTrashed) return nothing;
  const pageId = page.id;
  // The label is worked out at each render; the next change updates it.
  const edited = selectEditedLabel(state, pageId, new Date().toISOString());
  const history = { kind: PAGE_HISTORY_OVERLAY, anchorId: pageId };
  return html`${renderSuggesting(state, dispatch, pageId)}${renderLocked(page, dispatch)}
    <button
      type="button"
      class="page-info__edited"
      data-tooltip=${COPY.pageHistory.open}
      title=${tooltipTitle(COPY.pageHistory.open)}
      interestfor=${TOOLTIP_TARGET}
      @click=${() => dispatch(openOverlay.create({ overlay: history }))}
    >
      ${edited}
    </button>
    ${renderCopyLink(pageId)} ${renderCommentsButton(state, pageId, dispatch)}
    <button
      type="button"
      class="page-info__action page-info__favorite"
      aria-pressed=${String(page.props.isFavorite)}
      aria-label=${COPY.pageInfo.favorite}
      title=${tooltipTitle(COPY.pageInfo.favorite)}
      interestfor=${TOOLTIP_TARGET}
      @click=${() => dispatch(togglePageFavorite.create({ pageId }))}
    >
      ${renderIcon("star")}
    </button>`;
}

// "12 words · 64 characters", for the page menu.
export function wordCountLabel(state: AppState, pageId: BlockId): string {
  return countLabel(selectWordCount(state, pageId));
}
