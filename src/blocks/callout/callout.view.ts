import "./callout.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderEmojiPicker } from "../../ui/emoji/index.ts";
import {
  focusOverlayAnchor,
  showPopoverWhenConnected,
} from "../../ui/overlay/index.ts";
import { renderRichText } from "../../ui/rich-text/index.ts";
import { setCalloutIcon } from "./callout.commands.ts";
import type { CalloutBlock } from "./callout.schema.ts";

export const CALLOUT_ICON_OVERLAY = "callout-icon";

function renderPicker(
  block: CalloutBlock,
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const overlay = state.ui.overlay ?? {
    kind: CALLOUT_ICON_OVERLAY,
    anchorId: block.id,
  };
  const close = (): void => {
    focusOverlayAnchor();
    dispatch(closeOverlay.create({}));
  };
  const choose = (icon: string): void => {
    dispatch(setCalloutIcon.create({ blockId: block.id, icon }));
    close();
  };
  return html`<div
    class="callout__picker"
    popover="manual"
    data-overlay
    ${ref(showPopoverWhenConnected)}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    }}
  >
    ${renderEmojiPicker({
      query: overlay.query ?? "",
      onQuery: (query) =>
        dispatch(openOverlay.create({ overlay: { ...overlay, query } })),
      onChoose: choose,
      ...(block.props.icon !== "" && {
        onRemove: () => {
          choose("");
        },
      }),
    })}
  </div>`;
}

// The icon is a button that opens the emoji picker to change it. The
// callout's background is its block color, gray by default.
export function renderCallout(
  block: CalloutBlock,
  dispatch: Dispatch,
  state: AppState,
): TemplateResult {
  const { icon, text } = block.props;
  const { overlay } = state.ui;
  const isOpen =
    overlay?.kind === CALLOUT_ICON_OVERLAY && overlay.anchorId === block.id;
  const toggle = (): void => {
    const next = { kind: CALLOUT_ICON_OVERLAY, anchorId: block.id };
    dispatch(
      isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay: next }),
    );
  };
  return html`<div class="callout">
    <button
      type="button"
      class="callout__icon"
      data-overlay-anchor
      aria-label=${COPY.calloutBlock.icon}
      aria-expanded=${String(isOpen)}
      ?data-empty=${icon === ""}
      @click=${toggle}
    >
      ${icon}
    </button>
    ${isOpen ? renderPicker(block, state, dispatch) : nothing}
    ${renderRichText({ text, tag: "div", placeholder: COPY.blocks.callout })}
  </div>`;
}
