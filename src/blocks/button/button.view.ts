import "./button.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { pressButton, selectActionsSize } from "./button.commands.ts";
import { renderButtonConfig } from "./button-config.view.ts";
import type { ButtonBlock } from "./button.schema.ts";

export const BUTTON_CONFIG = "button-config";

// A button that runs its actions when pressed, with a second button beside
// it that opens its settings.
export function renderButtonBlock(
  block: ButtonBlock,
  dispatch: Dispatch,
  state: AppState,
): TemplateResult {
  const { overlay } = state.ui;
  const isOpen =
    overlay?.kind === BUTTON_CONFIG && overlay.anchorId === block.id;
  const press = (): void => {
    const blockCount = selectActionsSize(block.props.actions);
    dispatch(pressButton.create({ blockId: block.id, blockCount }));
  };
  const toggle = (): void => {
    const next = { kind: BUTTON_CONFIG, anchorId: block.id };
    dispatch(
      isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay: next }),
    );
  };
  const { label } = block.props;
  return html`<div class="button-block">
    <button type="button" class="button-block__press" @click=${press}>
      ${label === "" ? COPY.buttonBlock.untitledLabel : label}
    </button>
    <button
      type="button"
      class="button-block__settings"
      data-overlay-anchor
      aria-label=${COPY.buttonBlock.settings}
      aria-expanded=${String(isOpen)}
      @click=${toggle}
    >
      ⚙
    </button>
    ${isOpen ? renderButtonConfig(block, dispatch, state) : nothing}
  </div>`;
}
