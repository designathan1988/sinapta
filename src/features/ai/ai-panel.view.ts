// Notion AI's answer, shown at the foot of the page while it is written
// and once it is: Insert below, Replace and Discard (ADR-0013).
import "./ai.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  askAi,
  closeOverlay,
  discardAi,
  openOverlay,
  type OpenOverlay,
  type AiAction,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderMenu, type MenuItem } from "../../ui/menu/index.ts";
import {
  answerLineCount,
  insertAiBelow,
  replaceWithAi,
} from "./ai.commands.ts";

const TEXT = COPY.ai;

const ACTIONS: readonly AiAction[] = [
  "improve",
  "fix",
  "shorter",
  "longer",
  "summarize",
  "action-items",
  "translate",
  "explain",
  "continue",
];

export const AI_MENU_OVERLAY = "ask-ai";

// The block menu's "Ask AI": opens Notion's actions on the block's text in
// place of the block menu, as "Turn into" does.
export function askAiItem(overlay: OpenOverlay, dispatch: Dispatch): MenuItem {
  return {
    label: TEXT.ask,
    icon: "sparkles",
    opensPanel: true,
    onSelect: () =>
      dispatch(
        openOverlay.create({ overlay: { ...overlay, kind: AI_MENU_OVERLAY } }),
      ),
  };
}

// The actions on a block's text; choosing one asks the AI.
export function renderAskAiMenu(
  block: { readonly id: string; readonly text: string },
  dispatch: Dispatch,
  onClose: () => void,
): TemplateResult {
  return renderMenu({
    label: TEXT.ask,
    items: ACTIONS.map((action) => ({
      label: TEXT.actions[action],
      onSelect: () => {
        dispatch(askAi.create({ blockId: block.id, action, text: block.text }));
        dispatch(closeOverlay.create({}));
      },
    })),
    onClose,
    placement: "before",
  });
}

function renderButtons(state: AppState, dispatch: Dispatch): TemplateResult {
  const { answer } = state.persistence.ai;
  return html`<div class="ai__buttons">
    <button
      type="button"
      class="ai__primary"
      @click=${() =>
        dispatch(insertAiBelow.create({ lineCount: answerLineCount(answer) }))}
    >
      ${TEXT.insertBelow}
    </button>
    <button
      type="button"
      class="ai__quiet"
      @click=${() => dispatch(replaceWithAi.create({}))}
    >
      ${TEXT.replace}
    </button>
    <button
      type="button"
      class="ai__quiet"
      @click=${() => dispatch(discardAi.create({}))}
    >
      ${TEXT.discard}
    </button>
  </div>`;
}

function renderBody(state: AppState, dispatch: Dispatch): TemplateResult {
  const { status, answer, error } = state.persistence.ai;
  if (status === "thinking") {
    return answer === ""
      ? html`<p class="ai__thinking" role="status">${TEXT.thinking}</p>`
      : html`<p class="ai__answer" aria-busy="true">${answer}</p>`;
  }
  if (status === "failed") {
    return html`<p class="ai__error" role="alert">
        ${error === "model-missing" ? TEXT.modelMissing : TEXT.failed}
      </p>
      <div class="ai__buttons">
        <button
          type="button"
          class="ai__quiet"
          @click=${() => dispatch(discardAi.create({}))}
        >
          ${TEXT.discard}
        </button>
      </div>`;
  }
  return html`<p class="ai__answer">${answer}</p>
    ${renderButtons(state, dispatch)}`;
}

export function renderAiPanel(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const { status, blockId } = state.persistence.ai;
  if (status === "idle" || blockId === null) return nothing;
  return html`<section class="ai" aria-label=${TEXT.panel}>
    <p class="ai__title">${TEXT.panel}</p>
    ${renderBody(state, dispatch)}
  </section>`;
}
