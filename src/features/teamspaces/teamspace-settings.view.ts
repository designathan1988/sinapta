// Settings › Teamspaces, as Notion's (n89-settings-teamspaces): the
// workspace's teamspaces in a table, and "New teamspace".
import "./teamspaces.css";
import { html, type TemplateResult } from "lit-html";
import { selectTeamspaces } from "../../blocks/teamspace/index.ts";
import {
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { TEAMSPACE_CREATE_OVERLAY } from "./teamspace-create.view.ts";
import { renderTeamspaceRow } from "./teamspace-row.view.ts";

const TEXT = COPY.teamspace;

function renderNewButton(dispatch: Dispatch): TemplateResult {
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

export function renderTeamspaceSettings(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const teamspaces = selectTeamspaces(state);
  return html`<p class="settings__hint">${TEXT.settingsHint}</p>
    <div class="teamspaces__head">
      <div>
        <p class="teamspaces__title">${TEXT.listTitle}</p>
        <p class="settings__hint">${TEXT.listHint}</p>
      </div>
      ${renderNewButton(dispatch)}
    </div>
    <table class="teamspaces__table">
      <thead>
        <tr>
          <th>${TEXT.columnName}</th>
          <th>${TEXT.columnAccess}</th>
          <th>${TEXT.columnMembers}</th>
          <th>${TEXT.columnUpdated}</th>
        </tr>
      </thead>
      <tbody>
        ${
          teamspaces.length === 0
            ? html`<tr>
                <td class="teamspaces__none" colspan="4">${TEXT.none}</td>
              </tr>`
            : teamspaces.map((teamspace) =>
                renderTeamspaceRow(teamspace, state, dispatch),
              )
        }
      </tbody>
    </table>`;
}
