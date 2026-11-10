import "./page-link.css";
import { html, type TemplateResult } from "lit-html";
import {
  setActivePage,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { selectIsInTrash, selectPage, selectPageTitle } from "../page/index.ts";
import type { PageLinkBlock } from "./page-link.schema.ts";

export function renderPageLink(
  block: PageLinkBlock,
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const page = selectPage(state, block.props.pageId);
  if (page === undefined || selectIsInTrash(state, page)) {
    return html`<p class="page-link" data-missing>
      ${COPY.blocks.missingPage}
    </p>`;
  }
  const title = selectPageTitle(page);
  return html`<button
    type="button"
    class="page-link"
    @click=${() => dispatch(setActivePage.create({ pageId: page.id }))}
  >
    <span aria-hidden="true">${page.props.icon ?? "📄"}</span>
    <span class="page-link__title"
      >${title === "" ? COPY.sidebar.untitled : title}</span
    >
  </button>`;
}
