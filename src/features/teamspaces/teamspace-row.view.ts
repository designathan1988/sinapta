// A teamspace's row in Settings › Teamspaces: its name and owner, its
// access, its members with Join or Leave, when it last changed and its
// "…"; a closed one this person is not in shows Request to join; an
// owner sees who asks to join and approves them.
import { html, nothing, type TemplateResult } from "lit-html";
import {
  setTeamspaceAccess,
  TEAMSPACE_ACCESS,
  toggleTeamspaceMember,
  type TeamspaceAccess,
  type TeamspaceBlock,
} from "../../blocks/teamspace/index.ts";
import { firstGrapheme } from "../../model/index.ts";
import {
  requestSync,
  type AppState,
  type Dispatch,
  type ListedTeamspace,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderSelect } from "../../ui/select/index.ts";
import { renderTeamspaceMenu } from "./teamspace-menu.view.ts";
import type { TeamspaceTableRow } from "./teamspace-table.selectors.ts";

const TEXT = COPY.teamspace;
const DAY = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });
const ACCESS_WORDS: Record<TeamspaceAccess, string> = {
  open: TEXT.open,
  closed: TEXT.closed,
  private: TEXT.private,
};

const isAccess = (value: string): value is TeamspaceAccess =>
  TEAMSPACE_ACCESS.some((access) => access === value);

function renderAccess(
  teamspace: TeamspaceBlock,
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  return renderSelect(
    {
      id: `teamspace-access-${teamspace.id}`,
      label: TEXT.columnAccess,
      value: teamspace.props.access ?? "open",
      options: TEAMSPACE_ACCESS.map((value) => ({
        value,
        label: ACCESS_WORDS[value],
      })),
      variant: "quiet",
      onChoose: (value) => {
        if (!isAccess(value)) return;
        dispatch(
          setTeamspaceAccess.create({
            teamspaceId: teamspace.id,
            access: value,
          }),
        );
      },
    },
    { overlay: state.ui.overlay, dispatch },
  );
}

function renderMembers(
  teamspace: TeamspaceBlock,
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  if ((teamspace.props.access ?? "open") === "open") return nothing;
  const members = teamspace.props.memberIds ?? [];
  const me = state.persistence.account.user?.id;
  const count = `${String(members.length)} ${TEXT.membersCount}`;
  if (me === undefined || teamspace.createdBy?.id === me) return html`${count}`;
  return html`${count}
    <button
      type="button"
      class="teamspaces__join"
      @click=${() =>
        dispatch(
          toggleTeamspaceMember.create({
            teamspaceId: teamspace.id,
            userId: me,
          }),
        )}
    >
      ${members.includes(me) ? TEXT.leave : TEXT.join}
    </button>`;
}

// A closed teamspace this person is not in: ask to join it, once.
function renderAsk(listed: ListedTeamspace, dispatch: Dispatch) {
  if (listed.hasAsked)
    return html`<span class="teamspaces__asked">${TEXT.asked}</span>`;
  return html`<button
    type="button"
    class="teamspaces__join"
    @click=${() =>
      dispatch(
        requestSync.create({
          request: { kind: "join-teamspace", teamspaceId: listed.id },
        }),
      )}
  >
    ${TEXT.askToJoin}
  </button>`;
}

function renderRequests(row: TeamspaceTableRow, dispatch: Dispatch) {
  return (row.listed?.requests ?? []).map(
    (asking) =>
      html`<tr class="teamspaces__request">
        <td colspan="6">
          ${asking.name} ${TEXT.asksToJoin} ${row.name}
          <button
            type="button"
            class="teamspaces__join"
            @click=${() =>
              dispatch(
                requestSync.create({
                  request: {
                    kind: "approve-teamspace",
                    teamspaceId: row.id,
                    userId: asking.userId,
                  },
                }),
              )}
          >
            ${TEXT.approve}
          </button>
        </td>
      </tr>`,
  );
}

function renderName(row: TeamspaceTableRow): TemplateResult {
  return html`<td class="teamspaces__cell">
    <span class="teamspaces__letter" aria-hidden="true"
      >${row.teamspace?.props.icon ?? firstGrapheme(row.name).toUpperCase()}</span
    >
    ${row.name}
  </td>`;
}

export function renderTeamspaceRow(
  row: TeamspaceTableRow,
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const { teamspace, listed } = row;
  if (teamspace === undefined) {
    const access = isAccess(row.access) ? ACCESS_WORDS[row.access] : row.access;
    return html`<tr>
      ${renderName(row)}
      <td>${row.owner}</td>
      <td>${access}</td>
      <td>${listed === undefined ? nothing : renderAsk(listed, dispatch)}</td>
      <td></td>
      <td></td>
    </tr>`;
  }
  return html`<tr>
      ${renderName(row)}
      <td>${row.owner}</td>
      <td>${renderAccess(teamspace, state, dispatch)}</td>
      <td>${renderMembers(teamspace, state, dispatch)}</td>
      <td>${DAY.format(new Date(teamspace.updatedAt))}</td>
      <td>${renderTeamspaceMenu(teamspace, state, dispatch)}</td>
    </tr>
    ${renderRequests(row, dispatch)}`;
}
