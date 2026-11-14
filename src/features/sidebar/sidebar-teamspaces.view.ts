// Notion's Teamspaces section: each teamspace a row that opens and closes
// it, with "+" to add a page inside, and its pages under it.
import "./sidebar-sections.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { createPage } from "../../blocks/page/index.ts";
import {
  togglePageExpanded,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import {
  selectTeamspaceRows,
  type TeamspaceRow,
} from "./sidebar-teamspaces.selectors.ts";
import { renderTree } from "./sidebar-tree.view.ts";

const TEXT = COPY.teamspace;

function renderTeamspace(
  teamspace: TeamspaceRow,
  context: { readonly state: AppState; readonly dispatch: Dispatch },
): TemplateResult {
  const { dispatch } = context;
  return html`<div class="sidebar__row sidebar__teamspace">
      <button
        type="button"
        class="sidebar__teamspace-toggle"
        aria-expanded=${String(teamspace.isExpanded)}
        aria-label=${`${teamspace.isExpanded ? TEXT.collapse : TEXT.expand}: ${teamspace.name}`}
        @click=${() =>
          dispatch(togglePageExpanded.create({ pageId: teamspace.id }))}
      >
        <span class="sidebar__teamspace-mark" aria-hidden="true"
          >${teamspace.mark}</span
        >
        <span class="sidebar__title">${teamspace.name}</span>
      </button>
      <button
        type="button"
        class="sidebar__add"
        aria-label=${TEXT.addPage}
        title=${tooltipTitle(TEXT.addPage)}
        interestfor=${TOOLTIP_TARGET}
        @click=${() => dispatch(createPage.create({ parentId: teamspace.id }))}
      >
        ${renderIcon("plus")}
      </button>
    </div>
    ${teamspace.rows.length > 0 ? renderTree(teamspace.rows, context) : nothing}`;
}

export function renderTeamspaces(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const teamspaces = selectTeamspaceRows(state);
  if (teamspaces.length === 0) return nothing;
  return html`<section class="sidebar__section">
    <h2 class="sidebar__heading" id="sidebar-teamspaces">${TEXT.heading}</h2>
    ${teamspaces.map((teamspace) =>
      renderTeamspace(teamspace, { state, dispatch }),
    )}
  </section>`;
}
