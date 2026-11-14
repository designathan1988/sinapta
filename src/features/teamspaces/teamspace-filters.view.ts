// Notion's filters over Settings › Teamspaces (n94-teamspace-filters):
// status, owner, access and security, then a search by name; what they
// keep is kept in the open settings overlay.
import { html, type TemplateResult } from "lit-html";
import {
  setOverlayQuery,
  setOverlayValues,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderSelect } from "../../ui/select/index.ts";
import {
  filterOf,
  selectTeamspaceOwners,
} from "./teamspace-table.selectors.ts";

const TEXT = COPY.teamspace;
const ANY = "any";

interface Filter {
  readonly name: string;
  readonly label: string;
  // The choice that leaves the filter unset, and its words.
  readonly unset: string;
  readonly options: readonly {
    readonly value: string;
    readonly label: string;
  }[];
}

function renderFilter(
  state: AppState,
  dispatch: Dispatch,
  filter: Filter,
): TemplateResult {
  return renderSelect(
    {
      id: `teamspace-filter-${filter.name}`,
      label: filter.label,
      value: filterOf(state, filter.name) ?? filter.unset,
      options: filter.options,
      variant: "quiet",
      onChoose: (value) =>
        dispatch(
          setOverlayValues.create({
            name: filter.name,
            values: value === filter.unset ? null : [value],
          }),
        ),
    },
    { overlay: state.ui.overlay, dispatch },
  );
}

const STATUS: Filter = {
  name: "status",
  label: TEXT.status,
  unset: "active",
  options: [
    { value: "active", label: TEXT.active },
    { value: "archived", label: TEXT.archived },
  ],
};

const ACCESS: Filter = {
  name: "access",
  label: TEXT.columnAccess,
  unset: ANY,
  options: [
    { value: ANY, label: TEXT.columnAccess },
    { value: "open", label: TEXT.open },
    { value: "closed", label: TEXT.closed },
    { value: "private", label: TEXT.private },
  ],
};

const SECURITY: Filter = {
  name: "security",
  label: TEXT.security,
  unset: ANY,
  options: [
    { value: ANY, label: TEXT.security },
    { value: "overrides", label: TEXT.hasOverrides },
  ],
};

function filtersOf(state: AppState): Filter[] {
  const owners = selectTeamspaceOwners(state).map((owner) => ({
    value: owner,
    label: owner,
  }));
  const owner: Filter = {
    name: "owner",
    label: TEXT.columnOwners,
    unset: ANY,
    options: [{ value: ANY, label: TEXT.columnOwners }, ...owners],
  };
  return [STATUS, owner, ACCESS, SECURITY];
}

export function renderTeamspaceFilters(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  return html`<div class="teamspaces__filters">
    <div class="teamspaces__filter-row">
      ${filtersOf(state).map((filter) => renderFilter(state, dispatch, filter))}
    </div>
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
