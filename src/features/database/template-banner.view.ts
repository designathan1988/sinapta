// The strip over a template being edited, as Notion's: edge to edge under
// the peek's bar, "You're editing a template in" the database, a link to
// it, a help mark, and Repeat…, which says how often the template makes
// a row of its own.
import "./template-banner.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { selectPage, selectPageTitle } from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  setActivePage,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderMenu } from "../../ui/menu/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { repeatChoices } from "./template-actions.view.ts";
import { selectTemplateDatabase } from "./template.commands.ts";

const TEXT = COPY.database;

export const TEMPLATE_REPEAT_OVERLAY = "template-repeat";

// "Repeat…", or how often the template repeats.
function repeatLabel(state: AppState, templateId: BlockId): string {
  const every = selectPage(state, templateId)?.props.repeat?.every;
  return every === undefined
    ? TEXT.templateRepeatButton
    : TEXT.templateRepeatEvery(TEXT.repeatPeriods[every]);
}

// Repeat…, or how often it repeats, and its list while open.
function renderRepeat(
  state: AppState,
  dispatch: Dispatch,
  templateId: BlockId,
): TemplateResult {
  const { overlay } = state.ui;
  const isOpen =
    overlay?.kind === TEMPLATE_REPEAT_OVERLAY &&
    overlay.anchorId === templateId;
  const label = repeatLabel(state, templateId);
  const open = (): void => {
    const next = { kind: TEMPLATE_REPEAT_OVERLAY, anchorId: templateId };
    dispatch(
      isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay: next }),
    );
  };
  return html`<button
      type="button"
      class="database__template-repeat"
      data-overlay-anchor
      aria-haspopup="menu"
      aria-expanded=${String(isOpen)}
      @click=${open}
    >
      <span>${label}</span>${renderIcon("chevron")}
    </button>
    ${
      isOpen
        ? renderMenu({
            label: TEXT.templateRepeat,
            items: repeatChoices(state, dispatch, templateId),
            context: { overlay, dispatch },
            onClose: () => dispatch(closeOverlay.create({})),
          })
        : nothing
    }`;
}

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
    ${renderRepeat(state, dispatch, pageId)}
  </div>`;
}
