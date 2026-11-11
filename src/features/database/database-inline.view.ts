// A database inside a page's body: its title above its views, and a
// button that opens it as a page of its own, as in Notion.
import { html, type TemplateResult, nothing } from "lit-html";
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

function renderHeader(
  state: AppState,
  dispatch: Dispatch,
  databaseId: BlockId,
): TemplateResult | typeof nothing {
  const database = selectDatabase(state, databaseId);
  if (database === undefined) return nothing;
  const onTitle = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    dispatch(
      renamePage.create({ pageId: databaseId, title: event.target.value }),
    );
  };
  return html`<header class="database__inline-header">
    <input
      class="database__inline-title"
      type="text"
      aria-label=${COPY.database.databaseTitle}
      placeholder=${COPY.database.untitled}
      .value=${selectPageTitle(database)}
      @change=${onTitle}
    />
    <span class="database__inline-open">
      ${renderButton({
        label: COPY.database.openAsPage,
        icon: "expand",
        isIconOnly: true,
        onClick: () => dispatch(setActivePage.create({ pageId: databaseId })),
      })}
    </span>
  </header>`;
}

export function renderInlineDatabase(
  state: AppState,
  dispatch: Dispatch,
  databaseId: BlockId,
): TemplateResult | typeof nothing {
  const header = renderHeader(state, dispatch, databaseId);
  if (header === nothing) {
    return html`<p class="database__missing">${COPY.database.notFound}</p>`;
  }
  return renderDatabaseSection(state, dispatch, { databaseId, header });
}
