import "./synced-block.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  setActivePage,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import type { Block } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import { isPageLike, selectPageTitle, type PageBlock } from "../page/index.ts";
import { shownHolder } from "./synced-block.commands.ts";
import type { SyncedBlock } from "./synced-block.schema.ts";

// The page an original sits in.
function pageOf(state: AppState, block: Block): PageBlock | undefined {
  let parentId = block.parentId;
  while (parentId !== null) {
    const parent = state.workspace.blocks[parentId];
    if (parent === undefined) return undefined;
    if (isPageLike(parent)) return parent;
    parentId = parent.parentId;
  }
  return undefined;
}

// The label over a synced block. A reference names the page its original
// is in and opens it; its blocks are the original's, edited in place.
export function renderSyncedBlock(
  block: SyncedBlock,
  dispatch: Dispatch,
  state: AppState,
): TemplateResult {
  const holderId = shownHolder(state, block);
  const original = state.workspace.blocks[holderId];
  const isReference = holderId !== block.id;
  const page =
    isReference && original !== undefined ? pageOf(state, original) : undefined;
  const title = page === undefined ? "" : selectPageTitle(page);
  return html`<div class="synced-block" ?data-reference=${isReference}>
    <span class="synced-block__label">
      ${isReference ? COPY.syncedBlock.reference : COPY.syncedBlock.original}
    </span>
    ${
      page === undefined
        ? nothing
        : html`<button
            type="button"
            class="synced-block__source"
            @click=${() => dispatch(setActivePage.create({ pageId: page.id }))}
          >
            ${title === "" ? COPY.sidebar.untitled : title}
          </button>`
    }
  </div>`;
}
