// A teamspace's row in Settings › Teamspaces: its name, whether it is open
// to the workspace or closed to its members, its members with Join or
// Leave for this person, and when it last changed.
import { html, nothing, type TemplateResult } from "lit-html";
import {
  setTeamspaceAccess,
  TEAMSPACE_ACCESS,
  toggleTeamspaceMember,
  type TeamspaceAccess,
  type TeamspaceBlock,
} from "../../blocks/teamspace/index.ts";
import { firstGrapheme } from "../../model/index.ts";
import type { AppState, Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderSelect } from "../../ui/select/index.ts";

const TEXT = COPY.teamspace;

const DAY = new Intl.DateTimeFormat("en-US", { dateStyle: "medium" });

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
      options: [
        { value: "open", label: TEXT.open },
        { value: "closed", label: TEXT.closed },
      ],
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
): TemplateResult {
  const members = teamspace.props.memberIds ?? [];
  const me = state.persistence.account.user?.id;
  const count = `${String(members.length)} ${TEXT.membersCount}`;
  if (me === undefined) return html`${count}`;
  const isIn = members.includes(me);
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
      ${isIn ? TEXT.leave : TEXT.join}
    </button>`;
}

export function renderTeamspaceRow(
  teamspace: TeamspaceBlock,
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const { name, icon } = teamspace.props;
  const isClosed = teamspace.props.access === "closed";
  return html`<tr>
    <td class="teamspaces__cell">
      <span class="teamspaces__letter" aria-hidden="true"
        >${icon ?? firstGrapheme(name).toUpperCase()}</span
      >
      ${name}
    </td>
    <td>${teamspace.createdBy?.name ?? ""}</td>
    <td>${renderAccess(teamspace, state, dispatch)}</td>
    <td>${isClosed ? renderMembers(teamspace, state, dispatch) : nothing}</td>
    <td>${DAY.format(new Date(teamspace.updatedAt))}</td>
  </tr>`;
}
