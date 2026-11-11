// The property values of a database row, shown on the row's own page so
// they can be read and changed there as well as in the table.
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
import { setRowValue } from "./row.commands.ts";
import { propertyType } from "./property-registry.ts";

const INPUT_TYPES: Record<string, string> = { date: "date" };
const INPUT_MODES: Record<string, string> = { number: "decimal", url: "url" };
const MULTI_SELECT = "multi-select";

type Control = HTMLInputElement | HTMLSelectElement;

function storedOf(row: PageBlock, property: PropertyDefinition): unknown {
  const type = propertyType(property.type);
  return type.read(row.props.values?.[property.id]);
}

function renderInput(
  row: PageBlock,
  property: PropertyDefinition,
): TemplateResult {
  const type = propertyType(property.type);
  return html`<input
    class="database__field"
    type=${INPUT_TYPES[type.editor] ?? "text"}
    inputmode=${INPUT_MODES[type.editor] ?? nothing}
    .value=${type.format(storedOf(row, property), property)}
  />`;
}

function renderToggle(
  row: PageBlock,
  property: PropertyDefinition,
): TemplateResult {
  return html`<input
    type="checkbox"
    .checked=${storedOf(row, property) === true}
  />`;
}

function renderSelect(
  row: PageBlock,
  property: PropertyDefinition,
): TemplateResult {
  const chosen = storedOf(row, property);
  return html`<select class="database__field">
    <option value="" ?selected=${chosen === undefined}></option>
    ${(property.options ?? []).map(
      (option) =>
        html`<option value=${option.id} ?selected=${option.id === chosen}>
          ${option.name}
        </option>`,
    )}
  </select>`;
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
): TemplateResult {
  if (property.type === MULTI_SELECT) return renderMultiSelect(row, property);
  const { editor } = propertyType(property.type);
  const control =
    editor === "toggle"
      ? renderToggle(row, property)
      : editor === "options"
        ? renderSelect(row, property)
        : renderInput(row, property);
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

// The value a changed control asks for.
function valueOf(control: Control, property: PropertyDefinition): unknown {
  const group = control.closest("fieldset");
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
    ${properties.map((property) => renderProperty(row, property))}
  </div>`;
}
