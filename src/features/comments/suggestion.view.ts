// The head of a suggestion's card, as Notion's: who suggested it and when,
// then "Add: “…”" or "Delete: “…”" in blue, with Accept and Reject.
import { html, type TemplateResult } from "lit-html";
import type { Discussion, PageBlock } from "../../blocks/page/index.ts";
import type { Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { commentTime } from "./comments.selectors.ts";
import { renderAvatar } from "./comments.view.ts";
import {
  acceptSuggestionCommand,
  rejectSuggestionCommand,
} from "./suggestion.commands.ts";

const TEXT = COPY.suggestions;

export interface SuggestionCard {
  readonly page: PageBlock;
  readonly dispatch: Dispatch;
  readonly now: string;
}

// The avatar, the name and the time.
function renderAuthor(discussion: Discussion, now: string): TemplateResult {
  const at = discussion.suggestedAt;
  return html`<p class="comments__meta">
    ${renderAvatar()}<strong>${COPY.comments.author}</strong>
    ${
      at === undefined
        ? ""
        : html`<time datetime=${at}>${commentTime(at, now)}</time>`
    }
  </p>`;
}

function renderSettle(
  label: string,
  icon: "check" | "close",
  onPress: () => void,
): TemplateResult {
  return html`<button
    type="button"
    class="comments__resolve"
    aria-label=${label}
    title=${label}
    @click=${onPress}
  >
    ${renderIcon(icon)}
  </button>`;
}

export function renderSuggestionHead(
  discussion: Discussion,
  card: SuggestionCard,
): TemplateResult {
  const { page, dispatch } = card;
  const target = { pageId: page.id, discussionId: discussion.id };
  const verb = discussion.suggestion === "delete" ? TEXT.delete : TEXT.add;
  return html`<div class="comments__head">
    <div class="comments__suggestion">
      ${renderAuthor(discussion, card.now)}
      <p>${verb} <q>${discussion.quote ?? ""}</q></p>
    </div>
    ${renderSettle(TEXT.accept, "check", () =>
      dispatch(acceptSuggestionCommand.create(target)),
    )}
    ${renderSettle(TEXT.reject, "close", () =>
      dispatch(rejectSuggestionCommand.create(target)),
    )}
  </div>`;
}
