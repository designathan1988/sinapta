// The head of a suggestion's card, as Notion's: "Add: “…”" or "Delete:
// “…”" in blue, with Accept and Reject.
import { html, type TemplateResult } from "lit-html";
import type { Discussion, PageBlock } from "../../blocks/page/index.ts";
import type { Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import {
  acceptSuggestionCommand,
  rejectSuggestionCommand,
} from "./suggestion.commands.ts";

const TEXT = COPY.suggestions;

export function renderSuggestionHead(
  discussion: Discussion,
  page: PageBlock,
  dispatch: Dispatch,
): TemplateResult {
  const target = { pageId: page.id, discussionId: discussion.id };
  const verb = discussion.suggestion === "delete" ? TEXT.delete : TEXT.add;
  return html`<div class="comments__head">
    <p class="comments__suggestion">${verb} <q>${discussion.quote ?? ""}</q></p>
    <button
      type="button"
      class="comments__resolve"
      aria-label=${TEXT.accept}
      title=${TEXT.accept}
      @click=${() => dispatch(acceptSuggestionCommand.create(target))}
    >
      ${renderIcon("check")}
    </button>
    <button
      type="button"
      class="comments__resolve"
      aria-label=${TEXT.reject}
      title=${TEXT.reject}
      @click=${() => dispatch(rejectSuggestionCommand.create(target))}
    >
      ${renderIcon("close")}
    </button>
  </div>`;
}
