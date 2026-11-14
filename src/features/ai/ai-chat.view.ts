// Notion's AI chat, opened from the sidebar's "New chat" (ADR-0013): the
// conversation, and a field that asks the next question.
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import {
  closeOverlay,
  sendChat,
  type AppState,
  type ChatMessage,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { focusOnce } from "../../ui/focus/index.ts";

export const AI_CHAT_OVERLAY = "ai-chat";

const TEXT = COPY.ai;

function renderMessage(message: ChatMessage): TemplateResult {
  const text =
    message.from === "failed"
      ? message.text === "model-missing"
        ? TEXT.modelMissing
        : TEXT.failed
      : message.text;
  return html`<li class="ai__message" data-from=${message.from}>${text}</li>`;
}

// The answer being written, or "Thinking…" before its first words.
function renderPending(isThinking: boolean, answer: string) {
  if (!isThinking) return nothing;
  return answer === ""
    ? html`<li class="ai__thinking">${TEXT.thinking}</li>`
    : html`<li class="ai__message" data-from="ai" aria-busy="true">
        ${answer}
      </li>`;
}

export function renderAiChat(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const { chat, status, blockId, answer } = state.persistence.ai;
  const isThinking = status === "thinking" && blockId === null;
  return html`<form
    class="ai ai__chat"
    aria-label=${TEXT.chat}
    @submit=${(event: SubmitEvent) => {
      event.preventDefault();
      if (!(event.currentTarget instanceof HTMLFormElement)) return;
      const text = new FormData(event.currentTarget).get("message");
      if (typeof text !== "string") return;
      dispatch(sendChat.create({ text: text.trim() }));
      event.currentTarget.reset();
    }}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch(closeOverlay.create({}));
    }}
  >
    <p class="ai__title">${TEXT.chat}</p>
    <ul class="ai__messages" aria-live="polite">
      ${chat.length === 0 ? html`<li class="ai__hint">${TEXT.chatHint}</li>` : nothing}
      ${chat.map(renderMessage)} ${renderPending(isThinking, answer)}
    </ul>
    <input
      class="ai__prompt"
      name="message"
      aria-label=${TEXT.chat}
      placeholder=${TEXT.promptPlaceholder}
      autocomplete="off"
      ${ref(focusOnce)}
    />
  </form>`;
}
