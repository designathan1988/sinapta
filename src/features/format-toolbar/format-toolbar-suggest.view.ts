// The selection panel's "Suggest edits", as Notion's: it turns the page
// the text is on to Suggesting, or back.
import { html, type TemplateResult } from "lit-html";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { selectPageOf, setSuggesting } from "../comments/index.ts";
import type { PanelContext } from "./format-toolbar-rows.view.ts";

export function renderSuggestButton(context: PanelContext): TemplateResult {
  const { state, dispatch, range } = context;
  const pageId = selectPageOf(state, range.blockId)?.id ?? null;
  const isOn = pageId !== null && state.ui.suggestingPageId === pageId;
  return html`<button
    type="button"
    class="format-toolbar__button"
    aria-pressed=${String(isOn)}
    aria-label=${COPY.suggestions.suggest}
    data-tooltip=${COPY.suggestions.suggest}
    @click=${() => {
      dispatch(setSuggesting.create({ pageId: isOn ? null : pageId }));
    }}
  >
    ${renderIcon("compose")}
  </button>`;
}
