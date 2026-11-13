// A question asked before something that cannot be undone, as Notion's
// "Delete this comment?" and "Delete this template?": in the window's
// middle over a dimmed page, a red answer filling the width, then Cancel.
// As a list of an open popover it keeps the popover under it.
import "./confirm.css";
import { html, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { showPopoverWhenConnected } from "../overlay/index.ts";

export interface Confirm {
  readonly question: string;
  readonly answer: string;
  readonly cancel: string;
  readonly onAnswer: () => void;
  readonly onCancel: () => void;
  readonly isChild?: boolean;
}

export function renderConfirm(confirm: Confirm): TemplateResult {
  const { onAnswer, onCancel } = confirm;
  return html`<div
    class="confirm"
    popover="manual"
    data-overlay
    ?data-child=${confirm.isChild === true}
    role="alertdialog"
    aria-label=${confirm.question}
    ${ref(showPopoverWhenConnected)}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      onCancel();
    }}
  >
    <p class="confirm__question">${confirm.question}</p>
    <button
      type="button"
      class="button"
      data-variant="danger"
      data-autofocus
      @click=${() => {
        onCancel();
        onAnswer();
      }}
    >
      <span>${confirm.answer}</span>
    </button>
    <button
      type="button"
      class="button"
      data-variant="outline"
      @click=${onCancel}
    >
      <span>${confirm.cancel}</span>
    </button>
  </div>`;
}
