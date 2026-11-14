// The faces of the others on the open page, as Notion shows them beside
// Share (ADR-0013).
import "./presence.css";
import { html, nothing, type TemplateResult } from "lit-html";
import type { AppState, Presence } from "../../state/index.ts";
import { firstGrapheme } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";

const SHOWN = 3;

// The others on this page, this person left out.
export function selectOthersHere(state: AppState): readonly Presence[] {
  const pageId = state.ui.activePageId;
  const me = state.persistence.account.user?.id;
  return state.persistence.sync.presence.filter(
    (person) => person.pageId === pageId && person.userId !== me,
  );
}

export function renderPresence(
  state: AppState,
): TemplateResult | typeof nothing {
  const others = selectOthersHere(state);
  if (others.length === 0) return nothing;
  const names = others.map((person) => person.name).join(", ");
  return html`<span
    class="presence"
    role="img"
    aria-label=${`${COPY.share.viewing} ${names}`}
    title=${names}
  >
    ${others
      .slice(0, SHOWN)
      .map(
        (person) =>
          html`<span class="presence__face" aria-hidden="true"
            >${firstGrapheme(person.name).toUpperCase()}</span
          >`,
      )}
    ${
      others.length > SHOWN
        ? html`<span class="presence__more" aria-hidden="true"
            >+${String(others.length - SHOWN)}</span
          >`
        : nothing
    }
  </span>`;
}

// The others writing in this block, by name.
export function selectWritersIn(state: AppState, blockId: string): string {
  return selectOthersHere(state)
    .filter((person) => person.blockId === blockId)
    .map((person) => person.name)
    .join(", ");
}

// Notion's mark of another person in a block: their face at the block's
// end, named for the reader.
export function renderBlockPresence(
  state: AppState,
  blockId: string,
): TemplateResult | typeof nothing {
  const names = selectWritersIn(state, blockId);
  if (names === "") return nothing;
  return html`<span
    class="presence__block"
    role="img"
    aria-label=${`${COPY.share.writing} ${names}`}
    title=${names}
    contenteditable="false"
    >${firstGrapheme(names).toUpperCase()}</span
  >`;
}
