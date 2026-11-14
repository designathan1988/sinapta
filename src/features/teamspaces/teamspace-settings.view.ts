// Settings › Teamspaces, as Notion's (n89-settings-teamspaces): whether
// only the workspace's owners make teamspaces, then the teamspaces in a
// table under Notion's filters, and "New teamspace".
import "./teamspaces.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  openOverlay,
  requestSync,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderSwitchMark } from "../../ui/switch/index.ts";
import { TEAMSPACE_CREATE_OVERLAY } from "./teamspace-create.view.ts";
import { renderTeamspaceFilters } from "./teamspace-filters.view.ts";
import { renderTeamspaceRow } from "./teamspace-row.view.ts";
import { selectTeamspaceTable } from "./teamspace-table.selectors.ts";

const TEXT = COPY.teamspace;

// This person's place in the open workspace: its owner or not, and
// whether only owners make teamspaces.
function selectStanding(state: AppState) {
  const { workspaces, workspaceId } = state.persistence.sync;
  const open = workspaces.find((each) => each.id === workspaceId);
  const isOwner = open === undefined || open.role === "owner";
  const isLimited = open?.limitsTeamspaces === 1;
  return { isSignedIn: open !== undefined, isOwner, isLimited };
}

function renderLimit(state: AppState, dispatch: Dispatch) {
  const { isSignedIn, isOwner, isLimited } = selectStanding(state);
  if (!isSignedIn) return nothing;
  return html`<div class="settings__row">
    <div class="settings__text">
      <span class="settings__name">${TEXT.limit}</span>
      <span class="settings__hint">${TEXT.limitHint}</span>
    </div>
    <button
      type="button"
      class="settings__switch"
      role="switch"
      aria-checked=${String(isLimited)}
      aria-label=${TEXT.limit}
      ?disabled=${!isOwner}
      @click=${() =>
        dispatch(
          requestSync.create({
            request: { kind: "teamspace-limit", limited: !isLimited },
          }),
        )}
    >
      ${renderSwitchMark(isLimited)}
    </button>
  </div>`;
}

function renderNewButton(state: AppState, dispatch: Dispatch) {
  const { isOwner, isLimited } = selectStanding(state);
  if (isLimited && !isOwner) return nothing;
  return html`<button
    type="button"
    class="button"
    data-variant="primary"
    @click=${() =>
      dispatch(
        openOverlay.create({ overlay: { kind: TEAMSPACE_CREATE_OVERLAY } }),
      )}
  >
    ${TEXT.newTeamspace}
  </button>`;
}

function renderTable(state: AppState, dispatch: Dispatch): TemplateResult {
  const rows = selectTeamspaceTable(state);
  return html`<table class="teamspaces__table">
    <thead>
      <tr>
        <th>${TEXT.columnName}</th>
        <th>${TEXT.columnOwners}</th>
        <th>${TEXT.columnAccess}</th>
        <th>${TEXT.columnMembers}</th>
        <th>${TEXT.columnUpdated}</th>
        <th><span class="visually-hidden">${TEXT.more}</span></th>
      </tr>
    </thead>
    <tbody>
      ${
        rows.length === 0
          ? html`<tr>
              <td class="teamspaces__none" colspan="6">${TEXT.none}</td>
            </tr>`
          : rows.map((row) => renderTeamspaceRow(row, state, dispatch))
      }
    </tbody>
  </table>`;
}

export function renderTeamspaceSettings(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  return html`<p class="settings__hint">${TEXT.settingsHint}</p>
    ${renderLimit(state, dispatch)}
    <div class="teamspaces__head">
      <div>
        <p class="teamspaces__title">${TEXT.listTitle}</p>
        <p class="settings__hint">${TEXT.listHint}</p>
      </div>
      ${renderNewButton(state, dispatch)}
    </div>
    ${renderTeamspaceFilters(state, dispatch)} ${renderTable(state, dispatch)}`;
}
