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
  // "panel" is a smaller panel beside the sidebar's foot, as Notion's
  // trash, over the page without dimming it. "flyout" is as tall as the
  // window beside the sidebar, as Notion's inbox, and heads itself.
  // "form" is a dialog to fill in, as Notion's button automation: its
  // title quiet over a line. "card" is Notion's centered card, as its
  // Create a teamspace: its content heads itself, the close button alone
  // at the corner.
  readonly variant?:
    "search" | "settings" | "panel" | "flyout" | "full" | "form" | "card";
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

// The dialog's heading and close button: read only on a bare dialog, the
// title read only on a card.
function renderHeader(options: DialogOptions): TemplateResult {
  const isBare =
    options.variant !== undefined &&
    options.variant !== "full" &&
    options.variant !== "form" &&
    options.variant !== "card";
  return html`<header class=${isBare ? "visually-hidden" : "dialog__header"}>
    <h2
      class=${options.variant === "card" ? "visually-hidden" : "dialog__title"}
      id="dialog-title"
    >
      ${options.title}
    </h2>
    ${renderButton({
      label: options.closeLabel,
      icon: "close",
      isIconOnly: true,
      onClick: closeFrom,
    })}
  </header>`;
}

// A modal dialog. It is rendered only while it is open; closing it by any
// means fires `close`, which the caller turns into a command.
export function renderDialog(options: DialogOptions): TemplateResult {
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
    <div class="dialog__panel">${renderHeader(options)} ${options.content}</div>
  </dialog>`;
  // Each dialog gets its own element. A dialog that the browser has just
  // closed still reports its close a moment later, and that report must
  // not land on a different dialog shown in the same element.
  return html`${keyed(options.title, dialog)}`;
}
