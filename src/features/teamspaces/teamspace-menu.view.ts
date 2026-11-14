// A teamspace's "…" in Settings › Teamspaces: archive or restore it, and
// its security overrides, as Notion's teamspace settings.
import { html, type TemplateResult } from "lit-html";
import {
  archiveTeamspace,
  setTeamspaceSecurity,
  TEAMSPACE_SECURITY,
  type TeamspaceBlock,
} from "../../blocks/teamspace/index.ts";
import {
  closeChildOverlay,
  openChildOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderMenu } from "../../ui/menu/index.ts";
import { childIndexOf } from "../../ui/overlay/index.ts";

const TEXT = COPY.teamspace;

function renderMenuOf(
  teamspace: TeamspaceBlock,
  dispatch: Dispatch,
): TemplateResult {
  const teamspaceId = teamspace.id;
  const isArchived = teamspace.props.isArchived === true;
  const security = teamspace.props.security ?? {};
  return renderMenu({
    label: TEXT.more,
    isChild: true,
    items: [
      {
        label: isArchived ? TEXT.restore : TEXT.archive,
        icon: isArchived ? "restore" : "trash",
        onSelect: () =>
          dispatch(
            archiveTeamspace.create({ teamspaceId, isArchived: !isArchived }),
          ),
      },
      { kind: "divider" },
      ...TEAMSPACE_SECURITY.map((key) => ({
        label: TEXT[key],
        check: "switch" as const,
        isChecked: security[key] === true,
        keepsOpen: true,
        onSelect: () =>
          dispatch(
            setTeamspaceSecurity.create({
              teamspaceId,
              key,
              isOn: security[key] !== true,
            }),
          ),
      })),
    ],
    onClose: () => dispatch(closeChildOverlay.create({ depth: 0 })),
  });
}

export function renderTeamspaceMenu(
  teamspace: TeamspaceBlock,
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const anchorId = `teamspace-menu-${teamspace.id}`;
  const isOpen = childIndexOf(state.ui.overlay, anchorId) === 0;
  return html`<span class="teamspaces__more">
    <button
      type="button"
      class="teamspaces__more-button"
      data-overlay-child-anchor
      aria-haspopup="menu"
      aria-expanded=${String(isOpen)}
      aria-label=${TEXT.more}
      @click=${() =>
        dispatch(
          isOpen
            ? closeChildOverlay.create({ depth: 0 })
            : openChildOverlay.create({ anchorId, depth: 0 }),
        )}
    >
      ${renderIcon("more")}
    </button>
    ${isOpen ? renderMenuOf(teamspace, dispatch) : ""}
  </span>`;
}
