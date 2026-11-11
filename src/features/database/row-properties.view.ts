// The property values of a database row, shown on the row's own page so
// they can be read and changed there as well as in the table.
import { CHECKBOX_CLASS } from "../../ui/checkbox/index.ts";
import "./row-properties.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  selectDatabase,
  type PropertyDefinition,
} from "../../blocks/database/index.ts";
import { selectPage, type PageBlock } from "../../blocks/page/index.ts";
import type { AppState, Dispatch } from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { dateFromParts, renderDateRange } from "./properties/date/index.ts";
import { setRowValue } from "./row.commands.ts";
import {
  renderRowButton,
  renderRowFiles,
  renderRowRelation,
  type RowPage,
} from "./row-files.view.ts";
import { propertyType } from "./property-registry.ts";
import { renderOptionChoice } from "./row-option.view.ts";
import { selectRowValues } from "./row-values.selectors.ts";

const MULTI_SELECT = "multi-select";
const DATE = "date";

type Control = HTMLInputElement | HTMLSelectElement;

function storedOf(row: PageBlock, property: PropertyDefinition): unknown {
  const type = propertyType(property.type);
  return type.read(selectRowValues(row, [property])[property.id]);
}

// Values the app keeps, such as when the row was created, are only shown.
function renderReadOnly(
  row: PageBlock,
  property: PropertyDefinition,
): TemplateResult {
  const type = propertyType(property.type);
  return html`<output class="database__row-value"
    >${type.renderCell(storedOf(row, property), property)}</output
  >`;
}

function renderInput(
  row: PageBlock,
  property: PropertyDefinition,
): TemplateResult {
  const type = propertyType(property.type);
  return html`<input
    class="database__field"
    type=${type.input?.type ?? "text"}
    inputmode=${type.input?.mode ?? nothing}
    .value=${type.format(storedOf(row, property), property)}
  />`;
}

function renderToggle(
  row: PageBlock,
  property: PropertyDefinition,
): TemplateResult {
  return html`<input
    type="checkbox"
    class=${CHECKBOX_CLASS}
    .checked=${storedOf(row, property) === true}
  />`;
}

// A multi-select is a group of checkboxes, one per option.
function renderMultiSelect(
  row: PageBlock,
  property: PropertyDefinition,
): TemplateResult {
  const stored = storedOf(row, property);
  const chosen: unknown[] = Array.isArray(stored) ? stored : [];
  const options = property.options ?? [];
  return html`<fieldset
    class="database__row-property"
    data-property-id=${property.id}
  >
    <legend class="database__row-name">${property.name}</legend>
    <span class="database__row-options">
      ${options.length === 0 ? COPY.database.noOptions : nothing}
      ${options.map(
        (option) =>
          html`<label class="database__check">
            <input
              type="checkbox"
              class=${CHECKBOX_CLASS}
              value=${option.id}
              .checked=${chosen.includes(option.id)}
            />
            ${option.name}
          </label>`,
      )}
    </span>
  </fieldset>`;
}

function renderProperty(
  row: PageBlock,
  property: PropertyDefinition,
  page: RowPage,
): TemplateResult {
  if (property.type === MULTI_SELECT) return renderMultiSelect(row, property);
  if (property.type === DATE) {
    return renderDateRange(storedOf(row, property), property);
  }
  const { editor } = propertyType(property.type);
  if (editor === "files") return renderRowFiles(row, property, page);
  if (editor === "relation") return renderRowRelation(row, property, page);
  if (editor === "button") return renderRowButton(row, property, page);
  if (editor === "options") {
    return html`<div
      class="database__row-property"
      data-property-id=${property.id}
    >
      <span class="database__row-name">${property.name}</span>
      ${renderOptionChoice(row, property, page)}
    </div>`;
  }
  const controls: Partial<Record<string, typeof renderInput>> = {
    toggle: renderToggle,
    none: renderReadOnly,
  };
  const control = (controls[editor] ?? renderInput)(row, property);
  return html`<label
    class="database__row-property"
    data-property-id=${property.id}
  >
    <span class="database__row-name">${property.name}</span>
    ${control}
  </label>`;
}

// Stands for text that does not fit the property type.
const INVALID = Symbol("invalid");

// The date a range's three fields hold together.
function dateOf(group: HTMLElement): unknown {
  const part = (name: string): string =>
    group.querySelector<HTMLInputElement>(`[data-part="${name}"]`)?.value ?? "";
  const result = dateFromParts({
    start: part("start"),
    end: part("end"),
    time: part("time"),
  });
  return result.ok ? result.value : INVALID;
}

// The value a changed control asks for.
function valueOf(control: Control, property: PropertyDefinition): unknown {
  const group = control.closest("fieldset");
  if (group?.dataset.dateRange !== undefined) return dateOf(group);
  if (group !== null) {
    const checked = group.querySelectorAll<HTMLInputElement>("input:checked");
    const ids = [...checked].map((input) => input.value);
    return ids.length === 0 ? undefined : ids;
  }
  if (control instanceof HTMLInputElement && control.type === "checkbox")
    return control.checked ? true : undefined;
  const value = propertyType(property.type).parse(control.value);
  return value === undefined && control.value.trim() !== "" ? INVALID : value;
}

interface RowContext {
  readonly row: PageBlock;
  readonly properties: readonly PropertyDefinition[];
  readonly dispatch: Dispatch;
}

function onChange(event: Event, context: RowContext): void {
  const control = event.target;
  const isControl =
    control instanceof HTMLInputElement || control instanceof HTMLSelectElement;
  if (!isControl) return;
  const holder = control.closest<HTMLElement>("[data-property-id]");
  const property = context.properties.find(
    (item) => item.id === holder?.dataset.propertyId,
  );
  if (property === undefined) return;
  const value = valueOf(control, property);
  control.toggleAttribute("aria-invalid", value === INVALID);
  if (value === INVALID) {
    announce(COPY.database.invalidValue);
    return;
  }
  const rowId = context.row.id;
  context.dispatch(
    setRowValue.create({ rowId, propertyId: property.id, value }),
  );
}

export function renderRowProperties(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const row = selectPage(state, state.ui.activePageId);
  const database = selectDatabase(state, row?.parentId ?? null);
  const properties = database?.props.properties ?? [];
  if (row === undefined || properties.length === 0) return nothing;
  return html`<div
    class="database__row-properties"
    role="group"
    aria-label=${COPY.database.properties}
    @change=${(event: Event) => {
      onChange(event, { row, properties, dispatch });
    }}
  >
    ${properties.map((property) =>
      renderProperty(row, property, { state, dispatch }),
    )}
  </div>`;
}
