import { html, type TemplateResult } from "lit-html";
import type { AppState, Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  defineMediaCommands,
  isEmptyMedia,
  mediaAddress,
  renderMediaCaption,
  renderMediaEmpty,
  type MediaKind,
} from "../media/index.ts";
import { PDF_TYPE, type PdfBlock } from "./pdf.schema.ts";

export const pdfCommands = defineMediaCommands(PDF_TYPE);

const KIND: MediaKind = {
  commands: pdfCommands,
  accept: "application/pdf",
  text: COPY.media.pdf,
};

export function renderPdf(
  block: PdfBlock,
  dispatch: Dispatch,
  state: AppState,
): TemplateResult {
  if (isEmptyMedia(block.props)) {
    return renderMediaEmpty(block, KIND, { dispatch, state });
  }
  const address = mediaAddress(block.props, state);
  const name = block.props.name ?? COPY.media.pdf.name;
  // Frames may show blob addresses only: a PDF on the web opens in a tab.
  const shown =
    block.props.assetId === undefined
      ? html`<a
          class="media__link"
          data-media-source
          href=${address}
          target="_blank"
          rel="noreferrer"
          >${COPY.media.openPdf}</a
        >`
      : html`<iframe
          class="media__frame"
          title=${name}
          data-media-source
          src=${address}
        ></iframe>`;
  return html`<figure class="media">
    ${shown} ${renderMediaCaption(block, KIND, dispatch)}
  </figure>`;
}
