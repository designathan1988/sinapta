// A subpage as a line in its parent page: its icon and title. Pressing it
// opens the page; Backspace or Delete moves it to the trash, from where it
// can be restored.
import "./page-row.css";
import { html, type TemplateResult } from "lit-html";
import { setActivePage, type Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { trashPage } from "./page-trash.commands.ts";
import { DATABASE_TYPE, type PageBlock } from "./page.schema.ts";
import { selectPageTitle } from "./page.selectors.ts";

export function renderPageRow(
  page: PageBlock,
  dispatch: Dispatch,
): TemplateResult {
  const title = selectPageTitle(page) || COPY.sidebar.untitled;
  const glyph = renderIcon(page.type === DATABASE_TYPE ? "database" : "page");
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Backspace" && event.key !== "Delete") return;
    event.preventDefault();
    dispatch(trashPage.create({ pageId: page.id }));
  };
  return html`<button
    type="button"
    class="page-row"
    @click=${() => dispatch(setActivePage.create({ pageId: page.id }))}
    @keydown=${onKeyDown}
  >
    <span class="page-row__icon" aria-hidden="true"
      >${page.props.icon ?? glyph}</span
    >
    <span class="page-row__title">${title}</span>
  </button>`;
}
