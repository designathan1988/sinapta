// The filter of a view: conditions joined with and or or, and groups of
// conditions with a join of their own, one level deep. Every control
// finds what it changes by the path on it or on its row.
import { html, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type {
  Conjunction,
  FilterGroup,
  FilterItem,
  InnerFilterGroup,
} from "../../model/index.ts";
import { closeOverlay } from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import { renderSelect } from "../../ui/select/index.ts";
import {
  addFilter,
  addGroup,
  removeAt,
  setConjunction,
  updateAt,
  type FilterPath,
} from "./filter-edit.ts";
import { changedFilter, newFilter } from "./filter-fields.ts";
import { isFilterGroup } from "./filter-match.ts";
import { renderFilterRow, type FieldChange } from "./filter-row.view.ts";
import { renderFilterStart } from "./filter-start.view.ts";
import type { TableContext } from "./table-cell.view.ts";
import { setViewFilter } from "./view.commands.ts";

export const FILTERS_OVERLAY = "filters";

const CONJUNCTIONS: readonly Conjunction[] = ["and", "or"];

const CONJUNCTION_LABELS: Readonly<Record<Conjunction, string>> = {
  and: COPY.database.conjunctionAnd,
  or: COPY.database.conjunctionOr,
};

function setFilter(context: TableContext, filter: FilterGroup): void {
  const viewId = context.model.view.id;
  context.dispatch(setViewFilter.create({ viewId, filter }));
}

function parsePath(text: string | undefined): FilterPath | undefined {
  if (text === undefined) return undefined;
  return text === "" ? [] : text.split(".").map(Number);
}

function changeAt(
  context: TableContext,
  path: FilterPath,
  change: FieldChange,
): void {
  const filter = updateAt(context.model.view.filter, path, (item) =>
    changedFilter(item, change, context),
  );
  setFilter(context, filter);
}

// Typed values are fields; their row names the condition by its path.
function onInput(event: Event, context: TableContext): void {
  const control = event.target;
  if (!(control instanceof HTMLInputElement)) return;
  const holder = control.closest<HTMLElement>("[data-path]");
  const path = parsePath(holder?.dataset.path);
  if (path === undefined) return;
  changeAt(context, path, { field: "value", value: control.value });
}

interface Lead {
  readonly position: number;
  readonly conjunction: Conjunction;
  readonly groupPath: FilterPath;
}

// Before each item: "Where" first, then the group's join. The second
// item's join is the one to change; the later ones repeat it.
function renderLead(lead: Lead, context: TableContext): TemplateResult {
  const { position, conjunction, groupPath } = lead;
  if (position !== 1) {
    const text =
      position === 0
        ? COPY.database.filterWhere
        : CONJUNCTION_LABELS[conjunction];
    return html`<span class="database__filter-lead">${text}</span>`;
  }
  const choose = (value: string): void => {
    const join = value === "or" ? "or" : "and";
    const filter = context.model.view.filter;
    setFilter(context, setConjunction(filter, groupPath, join));
  };
  return html`<span class="database__filter-lead">
    ${renderSelect(
      {
        id: `filter-join-${groupPath.join(".")}`,
        label: COPY.database.filterConjunction,
        value: conjunction,
        options: CONJUNCTIONS.map((item) => ({
          value: item,
          label: CONJUNCTION_LABELS[item],
        })),
        variant: "quiet",
        onChoose: choose,
      },
      { overlay: context.state.ui.overlay, dispatch: context.dispatch },
    )}
  </span>`;
}

interface GroupProps {
  readonly group: InnerFilterGroup;
  readonly index: number;
  readonly lead: TemplateResult;
}

// The conditions of a group, each joined by the group's conjunction.
function renderGroupRows(
  group: InnerFilterGroup,
  index: number,
  context: TableContext,
): TemplateResult[] {
  const top = context.model.view.filter;
  return group.items.map((filter, at) =>
    renderFilterRow(
      {
        filter,
        path: [index, at],
        lead: renderLead(
          { position: at, conjunction: group.conjunction, groupPath: [index] },
          context,
        ),
        onRemove: () => {
          setFilter(context, removeAt(top, [index, at]));
        },
        onChange: (change) => {
          changeAt(context, [index, at], change);
        },
      },
      context,
    ),
  );
}

function renderGroup(props: GroupProps, context: TableContext): TemplateResult {
  const { group, index, lead } = props;
  const top = context.model.view.filter;
  const rows = renderGroupRows(group, index, context);
  const add = (): void => {
    const filter = newFilter(context);
    if (filter !== undefined)
      setFilter(context, addFilter(top, [index], filter));
  };
  return html`<li class="database__filter-group">
    ${lead}
    <div
      class="database__filter-box"
      role="group"
      aria-label=${COPY.database.filterGroup}
    >
      <ul class="database__filters">
        ${rows}
      </ul>
      ${renderButton({ label: COPY.database.addFilter, icon: "plus", onClick: add })}
    </div>
  </li>`;
}

function renderItem(
  item: FilterItem,
  index: number,
  context: TableContext,
): TemplateResult {
  const top = context.model.view.filter;
  const lead = renderLead(
    { position: index, conjunction: top.conjunction, groupPath: [] },
    context,
  );
  if (isFilterGroup(item)) {
    return renderGroup({ group: item, index, lead }, context);
  }
  const onRemove = (): void => {
    setFilter(context, removeAt(top, [index]));
  };
  const onChange = (change: FieldChange): void => {
    changeAt(context, [index], change);
  };
  return renderFilterRow(
    { filter: item, path: [index], lead, onRemove, onChange },
    context,
  );
}

export function renderFilters(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  const top = model.view.filter;
  if (top.items.length === 0) return renderFilterStart(context);
  const add = (isGroup: boolean) => (): void => {
    const filter = newFilter(context);
    if (filter === undefined) return;
    setFilter(
      context,
      isGroup ? addGroup(top, filter) : addFilter(top, [], filter),
    );
  };
  return html`<div
    class="database__popover"
    popover="manual"
    data-overlay
    ${ref(showPopoverWhenConnected)}
    @input=${(event: Event) => {
      onInput(event, context);
    }}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch(closeOverlay.create({}));
    }}
  >
    <ul class="database__filters">
      ${top.items.map((item, index) => renderItem(item, index, context))}
    </ul>
    <div class="database__filter-actions">
      ${renderButton({ label: COPY.database.addFilter, icon: "plus", onClick: add(false) })}
      ${renderButton({ label: COPY.database.addFilterGroup, icon: "plus", onClick: add(true) })}
    </div>
  </div>`;
}
