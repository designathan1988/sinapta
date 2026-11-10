import "./dialog.css";
import { html, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { renderButton } from "../button/index.ts";

export interface DialogOptions {
  readonly title: string;
  readonly closeLabel: string;
  readonly content: TemplateResult;
  // Called after the dialog has closed, however it was closed.
  readonly onClose: () => void;
}

// lit calls this while the element is still in a detached fragment on the
// first render, and a detached dialog cannot be shown, so wait one
// microtask for it to be connected.
function showWhenConnected(element: Element | undefined): void {
  if (!(element instanceof HTMLDialogElement) || element.open) return;
  if (element.isConnected) element.showModal();
  else
    queueMicrotask(() => {
      showWhenConnected(element);
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

// A modal dialog. It is rendered only while it is open; closing it by any
// means fires `close`, which the caller turns into a command.
export function renderDialog(options: DialogOptions): TemplateResult {
  return html`<dialog
    class="dialog"
    closedby="any"
    aria-labelledby="dialog-title"
    ${ref(showWhenConnected)}
    @close=${options.onClose}
    @click=${closeOnBackdrop}
  >
    <div class="dialog__panel">
      <header class="dialog__header">
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
}
