// A small field to add, change or remove the link on selected text.
import "./editor-link.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { parseBlockId, safeHref } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
  type TextSelection,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import { caretAt, setTextLink } from "./editor.commands.ts";
import { setSelection } from "../../state/index.ts";

export const LINK_OVERLAY = "link";

// Opens the field for the selected range; does nothing without a range.
export function openLinkField(
  selection: TextSelection,
  dispatch: Dispatch,
): boolean {
  const start = Math.min(selection.anchorOffset, selection.focusOffset);
  const end = Math.max(selection.anchorOffset, selection.focusOffset);
  if (start === end) return false;
  const overlay = {
    kind: LINK_OVERLAY,
    anchorId: selection.blockId,
    start,
    end,
  };
  dispatch(openOverlay.create({ overlay }));
  return true;
}

interface FormHandlers {
  readonly onSubmit: (event: SubmitEvent) => void;
  readonly onEscape: (event: KeyboardEvent) => void;
  readonly onRemove: () => void;
}

function renderForm(handlers: FormHandlers): TemplateResult {
  return html`<form
    class="editor__link"
    popover="manual"
    data-overlay
    ${ref(showPopoverWhenConnected)}
    @submit=${handlers.onSubmit}
    @keydown=${handlers.onEscape}
  >
    <label class="editor__link-field">
      ${COPY.link.fieldLabel}
      <input
        type="text"
        name="href"
        inputmode="url"
        data-autofocus
        aria-describedby="link-hint"
      />
    </label>
    <p class="editor__link-hint" id="link-hint">${COPY.link.invalid}</p>
    <div class="editor__link-actions">
      ${renderButton({
        label: COPY.link.remove,
        onClick: handlers.onRemove,
      })}
      <button type="submit" class="button" data-variant="primary">
        ${COPY.link.apply}
      </button>
    </div>
  </form>`;
}

export function renderLinkField(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const { overlay } = state.ui;
  const blockId = parseBlockId(overlay?.anchorId ?? "");
  if (overlay?.kind !== LINK_OVERLAY || blockId === undefined) return nothing;
  const range = { blockId, start: overlay.start ?? 0, end: overlay.end ?? 0 };
  const finish = (href: string | null): void => {
    dispatch(setTextLink.create({ ...range, href }));
    dispatch(closeOverlay.create({}));
    dispatch(setSelection.create({ selection: caretAt(blockId, range.end) }));
  };
  const onSubmit = (event: SubmitEvent): void => {
    event.preventDefault();
    const input =
      event.target instanceof HTMLFormElement
        ? event.target.elements.namedItem("href")
        : null;
    if (!(input instanceof HTMLInputElement)) return;
    const isValid = safeHref(input.value) !== undefined;
    input.setAttribute("aria-invalid", String(!isValid));
    if (isValid) finish(input.value);
  };
  const onEscape = (event: KeyboardEvent): void => {
    if (event.key === "Escape") dispatch(closeOverlay.create({}));
  };
  return renderForm({
    onSubmit,
    onEscape,
    onRemove: () => {
      finish(null);
    },
  });
}
