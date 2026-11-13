// A database inside a page's body, as in Notion: its title leads the row
// of its views, and among its tools a button opens it as a page of its
// own.
import { html, type TemplateResult, type nothing } from "lit-html";
import { selectDatabase } from "../../blocks/database/index.ts";
import { renamePage, selectPageTitle } from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import {
  setActivePage,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderDatabaseSection } from "./database.view.ts";
import "./database-inline.css";

function renderTitle(
  dispatch: Dispatch,
  databaseId: BlockId,
  title: string,
): TemplateResult {
  const onTitle = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    dispatch(
      renamePage.create({ pageId: databaseId, title: event.target.value }),
    );
  };
  return html`<input
    class="database__inline-title"
    type="text"
    aria-label=${COPY.database.databaseTitle}
    placeholder=${COPY.database.untitled}
    .value=${title}
    @change=${onTitle}
  />`;
}

export function renderInlineDatabase(
  state: AppState,
  dispatch: Dispatch,
  databaseId: BlockId,
): TemplateResult | typeof nothing {
  const database = selectDatabase(state, databaseId);
  if (database === undefined) {
    return html`<p class="database__missing">${COPY.database.notFound}</p>`;
  }
  const opener = renderButton({
    label: COPY.database.openAsPage,
    icon: "expand",
    isIconOnly: true,
    onClick: () => dispatch(setActivePage.create({ pageId: databaseId })),
  });
  return renderDatabaseSection(state, dispatch, {
    holderId: databaseId,
    header: renderTitle(dispatch, databaseId, selectPageTitle(database)),
    opener,
    isInline: true,
  });
}
