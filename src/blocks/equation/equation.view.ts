import "./equation.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  focusOverlayAnchor,
  showPopoverWhenConnected,
} from "../../ui/overlay/index.ts";
import { renderMath } from "../../ui/rich-text/index.ts";
import { setEquation } from "./equation.commands.ts";
import type { EquationBlock } from "./equation.schema.ts";

export const EQUATION_EDITOR = "equation-editor";

// A field for the TeX source under the drawn equation, which changes as
// it is typed. Escape or Done closes it.
function renderEditor(block: EquationBlock, dispatch: Dispatch) {
  const close = (): void => {
    focusOverlayAnchor();
    dispatch(closeOverlay.create({}));
  };
  const onInput = (event: Event): void => {
    if (!(event.target instanceof HTMLTextAreaElement)) return;
    const expression = event.target.value;
    dispatch(setEquation.create({ blockId: block.id, expression }));
  };
  return html`<div
    class="equation__editor"
    popover="manual"
    data-overlay
    ${ref(showPopoverWhenConnected)}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    }}
  >
    <textarea
      class="equation__source"
      rows="3"
      spellcheck="false"
      aria-label=${COPY.equation.source}
      placeholder=${COPY.equation.placeholder}
      data-autofocus
      .value=${block.props.expression}
      @input=${onInput}
    ></textarea>
    <button type="button" class="equation__done" @click=${close}>
      ${COPY.equation.done}
    </button>
  </div>`;
}

// The equation drawn as MathML; pressing it opens the editor.
export function renderEquation(
  block: EquationBlock,
  dispatch: Dispatch,
  state: AppState,
): TemplateResult {
  const { expression } = block.props;
  const { overlay } = state.ui;
  const isOpen =
    overlay?.kind === EQUATION_EDITOR && overlay.anchorId === block.id;
  const toggle = (): void => {
    const next = { kind: EQUATION_EDITOR, anchorId: block.id };
    dispatch(
      isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay: next }),
    );
  };
  return html`<div class="equation">
    <button
      type="button"
      class="equation__display"
      data-overlay-anchor
      aria-expanded=${String(isOpen)}
      aria-label=${COPY.equation.edit}
      ?data-empty=${expression === ""}
      @click=${toggle}
    >
      ${
        expression === ""
          ? COPY.equation.placeholder
          : renderMath(expression, "block")
      }
    </button>
    ${isOpen ? renderEditor(block, dispatch) : nothing}
  </div>`;
}
