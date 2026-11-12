import "./dialog.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { keyed } from "lit-html/directives/keyed.js";
import { ref } from "lit-html/directives/ref.js";
import { renderButton } from "../button/index.ts";
import { whenConnected } from "../focus/index.ts";

export interface DialogOptions {
  readonly title: string;
  readonly closeLabel: string;
  readonly content: TemplateResult;
  // Called after the dialog has closed, however it was closed.
  readonly onClose: () => void;
  // "search" is Notion's search: wide and tall, its title read but not
  // shown, closed by Escape or a click outside. "settings" is Notion's
  // settings: as large, its sections at the start, each its own title.
  readonly variant?: "search" | "settings";
}

function showWhenConnected(element: Element | undefined): void {
  if (!(element instanceof HTMLDialogElement)) return;
  whenConnected(element, () => {
    if (element.isConnected && !element.open) element.showModal();
  });
}

function closeFrom(event: Event): void {
  if (event.target instanceof Element) event.target.closest("dialog")?.close();
}

// Light dismiss for browsers without `closedby`: a click that lands on the
// dialog element itself is a click on the backdrop.
function closeOnBackdrop(event: Event): void {
  const hasNativeDismiss = "closedBy" in HTMLDialogElement.prototype;
  if (event.target instanceof HTMLDialogElement && !hasNativeDismiss) {
    event.target.close();
  }
}

// The browser reports a close a moment after it happens. By then another
// dialog may have taken this one's place, and it must not be closed for it:
// a dialog that is no longer in the page, or is open again, is ignored.
function onClosed(event: Event, onClose: () => void): void {
  const dialog = event.target;
  if (!(dialog instanceof HTMLDialogElement)) return;
  if (dialog.isConnected && !dialog.open) onClose();
}

// A modal dialog. It is rendered only while it is open; closing it by any
// means fires `close`, which the caller turns into a command.
export function renderDialog(options: DialogOptions): TemplateResult {
  // A search or settings shows its own heading; the dialog's is read only.
  const isBare = options.variant !== undefined;
  const dialog = html`<dialog
    class="dialog"
    data-variant=${options.variant ?? nothing}
    closedby="any"
    aria-labelledby="dialog-title"
    ${ref(showWhenConnected)}
    @close=${(event: Event) => {
      onClosed(event, options.onClose);
    }}
    @click=${closeOnBackdrop}
  >
    <div class="dialog__panel">
      <header class=${isBare ? "visually-hidden" : "dialog__header"}>
        <h2 class="dialog__title" id="dialog-title">${options.title}</h2>
        ${renderButton({
          label: options.closeLabel,
          icon: "close",
          isIconOnly: true,
          onClick: closeFrom,
        })}
      </header>
      ${options.content}
    </div>
  </dialog>`;
  // Each dialog gets its own element. A dialog that the browser has just
  // closed still reports its close a moment later, and that report must
  // not land on a different dialog shown in the same element.
  return html`${keyed(options.title, dialog)}`;
}
