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
import { renderFilterRow } from "./filter-row.view.ts";
import type { TableContext } from "./table-cell.view.ts";
import { setViewFilter } from "./view.commands.ts";

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

function onChange(event: Event, context: TableContext): void {
  const control = event.target;
  const isControl =
    control instanceof HTMLSelectElement || control instanceof HTMLInputElement;
  if (!isControl) return;
  const holder = control.closest<HTMLElement>("[data-path]");
  const path = parsePath(holder?.dataset.path);
  if (path === undefined) return;
  const field = control.dataset.field ?? "";
  const { value } = control;
  const filter = context.model.view.filter;
  const next =
    field === "conjunction"
      ? setConjunction(filter, path, value === "or" ? "or" : "and")
      : updateAt(filter, path, (item) =>
          changedFilter(item, { field, value }, context),
        );
  setFilter(context, next);
}

// Before each item: "Where" first, then the group's join. The second
// item's join is the one to change; the later ones repeat it.
function renderLead(
  position: number,
  conjunction: Conjunction,
  groupPath: FilterPath,
): TemplateResult {
  if (position !== 1) {
    const text =
      position === 0
        ? COPY.database.filterWhere
        : CONJUNCTION_LABELS[conjunction];
    return html`<span class="database__filter-lead">${text}</span>`;
  }
  return html`<select
    class="database__field database__filter-lead"
    data-field="conjunction"
    data-path=${groupPath.join(".")}
    aria-label=${COPY.database.filterConjunction}
  >
    ${CONJUNCTIONS.map(
      (item) =>
        html`<option value=${item} ?selected=${item === conjunction}>
          ${CONJUNCTION_LABELS[item]}
        </option>`,
    )}
  </select>`;
}

interface GroupProps {
  readonly group: InnerFilterGroup;
  readonly index: number;
  readonly lead: TemplateResult;
}

function renderGroup(props: GroupProps, context: TableContext): TemplateResult {
  const { group, index, lead } = props;
  const top = context.model.view.filter;
  const rows = group.items.map((filter, at) =>
    renderFilterRow(
      {
        filter,
        path: [index, at],
        lead: renderLead(at, group.conjunction, [index]),
        onRemove: () => {
          setFilter(context, removeAt(top, [index, at]));
        },
      },
      context,
    ),
  );
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
  const lead = renderLead(index, top.conjunction, []);
  if (isFilterGroup(item)) {
    return renderGroup({ group: item, index, lead }, context);
  }
  const onRemove = (): void => {
    setFilter(context, removeAt(top, [index]));
  };
  return renderFilterRow(
    { filter: item, path: [index], lead, onRemove },
    context,
  );
}

export function renderFilters(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  const top = model.view.filter;
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
    @change=${(event: Event) => {
      onChange(event, context);
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
