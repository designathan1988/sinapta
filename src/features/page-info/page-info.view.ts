// The top bar's page details: when the open page was last edited, and a
// star that adds it to or removes it from the favorites.
import "./page-info.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { selectPage, togglePageFavorite } from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import type { AppState, Dispatch } from "../../state/index.ts";
import { COPY, pluralize } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { selectEditedLabel, selectWordCount } from "./page-info.selectors.ts";

export function renderPageInfo(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const page = selectPage(state, state.ui.activePageId);
  if (page === undefined || page.props.isTrashed) return nothing;
  const pageId = page.id;
  // The label is worked out at each render; the next change updates it.
  const edited = selectEditedLabel(state, pageId, new Date().toISOString());
  return html`<span class="page-info__edited">${edited}</span>
    <button
      type="button"
      class="page-info__favorite"
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
  const count = selectWordCount(state, pageId);
  const words = `${String(count.words)} ${pluralize(count.words, COPY.pageInfo.words)}`;
  const characters = `${String(count.characters)} ${pluralize(count.characters, COPY.pageInfo.characters)}`;
  return `${words} · ${characters}`;
}
