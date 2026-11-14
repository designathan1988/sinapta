// Notion AI on an empty line: Space opens "Ask AI anything…", and what is
// asked is answered in the AI panel (ADR-0013).
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import {
  askAi,
  closeOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { focusOnce } from "../../ui/focus/index.ts";

export const AI_PROMPT_OVERLAY = "ai-prompt";

export function renderAiPrompt(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const blockId = state.ui.overlay?.anchorId;
  if (blockId === undefined) return nothing;
  return html`<form
    class="ai"
    aria-label=${COPY.ai.ask}
    @submit=${(event: SubmitEvent) => {
      event.preventDefault();
      if (!(event.currentTarget instanceof HTMLFormElement)) return;
      const text = new FormData(event.currentTarget).get("prompt");
      if (typeof text !== "string" || text.trim() === "") return;
      dispatch(closeOverlay.create({}));
      dispatch(askAi.create({ blockId, action: "ask", text: text.trim() }));
    }}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch(closeOverlay.create({}));
    }}
  >
    <p class="ai__title">${COPY.ai.panel}</p>
    <input
      class="ai__prompt"
      name="prompt"
      aria-label=${COPY.ai.ask}
      placeholder=${COPY.ai.promptPlaceholder}
      autocomplete="off"
      ${ref(focusOnce)}
    />
  </form>`;
}
