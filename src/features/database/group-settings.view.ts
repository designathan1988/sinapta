// The grouping settings of a view: the property it groups by and, once
// grouped, how its groups are sorted, how dates are grouped and whether
// empty groups show. One listener reads every control by its field.
import { html, nothing, type TemplateResult } from "lit-html";
import type { GroupBy } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  setGroupOptions,
  setViewGroupBy,
  type GroupOptions,
} from "./group.commands.ts";
import type { DateStep } from "./grouping-definition.ts";
import { isGroupable } from "./row-groups.selectors.ts";
import type { TableContext } from "./table-cell.view.ts";

const SORTS: readonly GroupBy["sort"][] = ["manual", "ascending", "descending"];
const STEPS: readonly DateStep[] = ["day", "week", "month", "year"];

function groupOptions(
  field: string | undefined,
  control: HTMLSelectElement | HTMLInputElement,
): GroupOptions | undefined {
  if (field === "hideEmpty" && control instanceof HTMLInputElement) {
    return { hideEmpty: control.checked };
  }
  const sort = SORTS.find((item) => item === control.value);
  if (field === "sort" && sort !== undefined) return { sort };
  const dateBy = STEPS.find((item) => item === control.value);
  if (field === "dateBy" && dateBy !== undefined) return { dateBy };
  return undefined;
}

function onChange(event: Event, context: TableContext): void {
  const control = event.target;
  const isControl =
    control instanceof HTMLSelectElement || control instanceof HTMLInputElement;
  if (!isControl) return;
  const { model, dispatch } = context;
  const viewId = model.view.id;
  const field = control.dataset.field;
  if (field === "property") {
    const property = model.database.props.properties.find(
      (item) => item.id === control.value,
    );
    const propertyId = property?.id ?? null;
    dispatch(setViewGroupBy.create({ viewId, propertyId }));
    return;
  }
  const options = groupOptions(field, control);
  if (options !== undefined) {
    dispatch(setGroupOptions.create({ viewId, options }));
  }
}

function renderChoice<TValue extends string>(
  field: string,
  values: readonly TValue[],
  current: { readonly value: TValue; readonly labels: Record<TValue, string> },
): TemplateResult {
  return html`<select class="database__field" data-field=${field}>
    ${values.map(
      (value) =>
        html`<option value=${value} ?selected=${value === current.value}>
          ${current.labels[value]}
        </option>`,
    )}
  </select>`;
}

function renderOptions(groupBy: GroupBy, isDate: boolean): TemplateResult {
  const { groupSorts, dateSteps } = COPY.database;
  return html`${
      isDate
        ? html`<label class="database__view-name">
            ${COPY.database.dateStep}
            ${renderChoice("dateBy", STEPS, { value: groupBy.dateBy, labels: dateSteps })}
          </label>`
        : nothing
    }
    <label class="database__view-name">
      ${COPY.database.groupSort}
      ${renderChoice("sort", SORTS, { value: groupBy.sort, labels: groupSorts })}
    </label>
    <label class="database__check">
      <input
        type="checkbox"
        data-field="hideEmpty"
        .checked=${groupBy.hideEmpty}
      />
      ${COPY.database.hideEmptyGroups}
    </label>`;
}

function option(
  value: string,
  label: string,
  isSelected: boolean,
): TemplateResult {
  return html`<option value=${value} ?selected=${isSelected}>${label}</option>`;
}

export function renderGroupSettings(context: TableContext): TemplateResult {
  const { groupBy, type } = context.model.view;
  const properties =
    context.model.database.props.properties.filter(isGroupable);
  const grouped = properties.find((item) => item.id === groupBy?.propertyId);
  // A board always groups, so it has no choice of none.
  const canUngroup = type !== "board" || grouped === undefined;
  return html`<div
    class="database__group-settings"
    @change=${(event: Event) => {
      onChange(event, context);
    }}
  >
    <label class="database__view-name">
      ${COPY.database.group}
      <select class="database__field" data-field="property">
        ${canUngroup ? option("", COPY.database.noGrouping, !grouped) : nothing}
        ${properties.map((property) =>
          option(property.id, property.name, property.id === grouped?.id),
        )}
      </select>
    </label>
    ${
      groupBy === undefined || grouped === undefined
        ? nothing
        : renderOptions(groupBy, grouped.type === "date")
    }
  </div>`;
}
