// The strip over a template being edited, as Notion's: edge to edge under
// the peek's bar, "You're editing a template in" the database, a link to
// it, a help mark, and Repeat…, which says how often the template makes
// a row of its own.
import "./template-banner.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { selectPageTitle } from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import {
  setActivePage,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { renderRepeatButton } from "./template-repeat.view.ts";
import { selectTemplateDatabase } from "./template.commands.ts";

const TEXT = COPY.database;

export function renderTemplateBanner(
  state: AppState,
  pageId: BlockId,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const database = selectTemplateDatabase(state, pageId);
  if (database === undefined) return nothing;
  const title = selectPageTitle(database);
  const name = title === "" ? COPY.sidebar.untitled : title;
  const icon = database.props.icon ?? renderIcon("database");
  return html`<div class="database__template-banner" role="note">
    <span>${TEXT.templateBannerLead}</span>
    <span class="database__template-icon" aria-hidden="true">${icon}</span>
    <button
      type="button"
      class="database__template-link"
      @click=${() => dispatch(setActivePage.create({ pageId: database.id }))}
    >
      ${name}
    </button>
    <span
      class="database__template-help"
      role="img"
      tabindex="0"
      aria-label=${TEXT.templateHelp}
      title=${tooltipTitle(TEXT.templateHelp)}
      interestfor=${TOOLTIP_TARGET}
      >${renderIcon("help")}</span
    >
    ${renderRepeatButton(state, dispatch, pageId)}
  </div>`;
}
