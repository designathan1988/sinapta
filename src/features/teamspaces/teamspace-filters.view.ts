// Notion's filters over Settings › Teamspaces (n89-settings-teamspaces):
// by access, and a search by name; what they keep is kept in the open
// settings overlay.
import { html, type TemplateResult } from "lit-html";
import {
  selectTeamspaces,
  type TeamspaceBlock,
} from "../../blocks/teamspace/index.ts";
import {
  setOverlayQuery,
  setOverlayValues,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderSelect } from "../../ui/select/index.ts";

const TEXT = COPY.teamspace;
const ALL = "all";

// The teamspaces the filters keep, in their order.
export function selectShownTeamspaces(state: AppState): TeamspaceBlock[] {
  const words = (state.ui.overlay?.query ?? "").trim().toLowerCase();
  const access = state.ui.overlay?.values?.access?.[0];
  return selectTeamspaces(state).filter(
    (teamspace) =>
      teamspace.props.name.toLowerCase().includes(words) &&
      (access === undefined || (teamspace.props.access ?? "open") === access),
  );
}

function renderAccessFilter(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const access = state.ui.overlay?.values?.access?.[0] ?? ALL;
  return renderSelect(
    {
      id: "teamspace-filter-access",
      label: TEXT.columnAccess,
      value: access,
      options: [
        { value: ALL, label: `${TEXT.columnAccess}: ${TEXT.all}` },
        { value: "open", label: `${TEXT.columnAccess}: ${TEXT.open}` },
        { value: "closed", label: `${TEXT.columnAccess}: ${TEXT.closed}` },
      ],
      variant: "quiet",
      onChoose: (value) =>
        dispatch(
          setOverlayValues.create({
            name: "access",
            values: value === ALL ? null : [value],
          }),
        ),
    },
    { overlay: state.ui.overlay, dispatch },
  );
}

export function renderTeamspaceFilters(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const select = renderAccessFilter(state, dispatch);
  return html`<div class="teamspaces__filters">
    ${select}
    <input
      class="teamspaces__search"
      type="search"
      aria-label=${TEXT.search}
      placeholder=${TEXT.search}
      .value=${state.ui.overlay?.query ?? ""}
      @input=${(event: Event) => {
        if (!(event.currentTarget instanceof HTMLInputElement)) return;
        dispatch(setOverlayQuery.create({ query: event.currentTarget.value }));
      }}
    />
  </div>`;
}
