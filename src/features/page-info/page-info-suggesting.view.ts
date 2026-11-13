// "Suggesting ×" in the top bar while the page suggests, as Notion's:
// blue, and a press turns Suggesting off.
import { html, nothing, type TemplateResult } from "lit-html";
import type { BlockId } from "../../model/index.ts";
import type { AppState, Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { setSuggesting } from "../comments/index.ts";

export function renderSuggesting(
  state: AppState,
  dispatch: Dispatch,
  pageId: BlockId,
): TemplateResult | typeof nothing {
  if (state.ui.suggestingPageId !== pageId) return nothing;
  return html`<button
    type="button"
    class="page-info__suggesting"
    aria-label=${COPY.suggestions.stop}
    title=${COPY.suggestions.youreSuggesting}
    @click=${() => dispatch(setSuggesting.create({ pageId: null }))}
  >
    <span>${COPY.suggestions.suggesting}</span>${renderIcon("close")}
  </button>`;
}
