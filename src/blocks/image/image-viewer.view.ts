// An image shown full screen in a modal dialog; Escape, the close button
// or a press outside it closes it.
import { html, nothing, type TemplateResult } from "lit-html";
import {
  closeOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderDialog } from "../../ui/dialog/index.ts";
import type { ImageBlock } from "./image.schema.ts";

export const IMAGE_VIEWER_OVERLAY = "image-viewer";

export function renderImageViewer(
  block: ImageBlock,
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const { overlay } = state.ui;
  const isOpen =
    overlay?.kind === IMAGE_VIEWER_OVERLAY && overlay.anchorId === block.id;
  if (!isOpen) return nothing;
  const { src, caption } = block.props;
  return renderDialog({
    title: caption === "" ? COPY.imageBlock.fullScreenTitle : caption,
    closeLabel: COPY.imageBlock.close,
    content: html`<img class="image__full" src=${src} alt=${caption} />`,
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
