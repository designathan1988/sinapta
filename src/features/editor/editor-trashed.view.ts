// A page in the trash opens as Notion's: read only, under a red banner
// that restores it or deletes it for good, after the trash asks.
import "./editor-trashed.css";
import { html, type TemplateResult } from "lit-html";
import { restorePage, type PageBlock } from "../../blocks/page/index.ts";
import { openOverlay, type Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { TRASH_OVERLAY } from "../trash/index.ts";

export function renderTrashedBanner(
  page: PageBlock,
  dispatch: Dispatch,
): TemplateResult {
  const pageId = page.id;
  // The trash asks before deleting: its anchor names the page.
  const confirm = { kind: TRASH_OVERLAY, anchorId: pageId };
  return html`<div class="editor__trashed" role="status">
    <span>${COPY.trash.pageInTrash}</span>
    <button
      type="button"
      class="editor__trashed-action"
      @click=${() => dispatch(restorePage.create({ pageId }))}
    >
      ${COPY.trash.restorePage}
    </button>
    <button
      type="button"
      class="editor__trashed-action"
      @click=${() => dispatch(openOverlay.create({ overlay: confirm }))}
    >
      ${COPY.trash.delete}
    </button>
  </div>`;
}
