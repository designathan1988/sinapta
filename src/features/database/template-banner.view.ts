// The note over a template being edited, as Notion's: it says the page is
// a template of its database, so edits change the rows to come.
import "./template-banner.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { selectPageTitle } from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { selectTemplateDatabase } from "./template.commands.ts";

export function renderTemplateBanner(
  state: AppState,
  pageId: BlockId,
): TemplateResult | typeof nothing {
  const database = selectTemplateDatabase(state, pageId);
  if (database === undefined) return nothing;
  const title = selectPageTitle(database);
  const name = title === "" ? COPY.sidebar.untitled : title;
  return html`<p class="database__template-banner" role="note">
    ${renderIcon("page")} ${COPY.database.templateBanner(name)}
  </p>`;
}
