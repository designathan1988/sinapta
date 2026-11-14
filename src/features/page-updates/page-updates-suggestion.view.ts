// A suggested edit in the Updates tab, as Notion's: "You made suggestions
// in <page>", when, what it adds or deletes, and Reply, which opens the
// page's discussions.
import { html, type TemplateResult } from "lit-html";
import { selectPageTitle, type PageBlock } from "../../blocks/page/index.ts";
import { openOverlay, type Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { DISCUSSIONS_PANEL_OVERLAY } from "../comments/index.ts";
import { renderPersonMark } from "./page-updates-person.view.ts";
import type { SuggestionEntry } from "./page-updates-suggestions.selectors.ts";
import { selectTimeAgo } from "./page-updates.selectors.ts";

const TEXT = COPY.pageUpdates;

export function renderSuggestionEntry(
  view: { readonly page: PageBlock; readonly you: string; now: string },
  entry: SuggestionEntry,
  dispatch: Dispatch,
): TemplateResult {
  const other = entry.author === view.you ? undefined : entry.author;
  const who =
    other === undefined ? TEXT.youSuggested : `${other} ${TEXT.suggested}`;
  const verb =
    entry.kind === "delete" ? COPY.suggestions.delete : COPY.suggestions.add;
  const panel = { kind: DISCUSSIONS_PANEL_OVERLAY, anchorId: view.page.id };
  return html`<article class="page-updates__entry">
    ${renderPersonMark(other ?? view.you)}
    <div class="page-updates__entry-body">
      <p class="page-updates__summary">
        ${who} <strong>${selectPageTitle(view.page)}</strong>
      </p>
      <time class="page-updates__when" datetime=${entry.at}
        >${selectTimeAgo(entry.at, view.now)}</time
      >
      <p class="page-updates__suggested">${verb} “${entry.text}”</p>
      <button
        type="button"
        class="button page-updates__reply"
        data-variant="outline"
        @click=${() => dispatch(openOverlay.create({ overlay: panel }))}
      >
        ${TEXT.reply}
      </button>
    </div>
  </article>`;
}
