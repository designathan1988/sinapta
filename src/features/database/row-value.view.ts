// One property's value on a row's page, as Notion's row page shows it:
// drawn as the table draws its cell, and changed where it sits — text in
// place, options from their list, a date from its fields, tags from
// their list with a tick each.
import { html, nothing, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { PageBlock } from "../../blocks/page/index.ts";
import { CHECKBOX_CLASS } from "../../ui/checkbox/index.ts";
import { renderChip } from "../../ui/chip/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuItem } from "../../ui/menu/index.ts";
import { renderSelect, type SelectMenu } from "../../ui/select/index.ts";
import { renderDateRange } from "./properties/date/index.ts";
import { propertyType } from "./property-registry.ts";
import {
  renderRowButton,
  renderRowFiles,
  renderRowRelation,
  type RowPage,
} from "./row-files.view.ts";
import { renderOptionChoice } from "./row-option.view.ts";
import { selectAllRowValues } from "./row-values.selectors.ts";
import { setRowValue } from "./row.commands.ts";

const TEXT = COPY.database;

// The value as the property's type reads it, worked out when the app
// keeps or computes it.
function valueOf(row: PageBlock, property: PropertyDefinition, page: RowPage) {
  const today = new Date().toLocaleDateString("en-CA");
  const values = selectAllRowValues({ state: page.state, today }, row, [
    property,
  ]);
  return propertyType(property.type).read(values[property.id]);
}

function renderEmpty(): TemplateResult {
  return html`<span class="database__row-empty">${TEXT.emptyValue}</span>`;
}

// The property whose value is shown, on its row's page.
interface RowCell {
  readonly row: PageBlock;
  readonly property: PropertyDefinition;
  readonly page: RowPage;
}

// A value that opens a menu: a date's fields, or the options of tags.
function renderOpener(
  { row, property, page }: RowCell,
  opened: { readonly display: TemplateResult; readonly menu: SelectMenu },
): TemplateResult {
  return renderSelect(
    {
      id: `row-${row.id}-${property.id}`,
      label: property.name,
      value: undefined,
      options: [],
      display: opened.display,
      menu: opened.menu,
      variant: "quiet",
      // The menu's own rows and fields change the value.
      onChoose: () => undefined,
    },
    { overlay: page.state.ui.overlay, dispatch: page.dispatch },
  );
}

function renderTags(
  row: PageBlock,
  property: PropertyDefinition,
  page: RowPage,
): TemplateResult {
  const value = valueOf(row, property, page);
  const chosen = Array.isArray(value) ? value.map(String) : [];
  const options = property.options ?? [];
  const set = (ids: readonly string[]): void => {
    const next = ids.length === 0 ? undefined : [...ids];
    const change = { rowId: row.id, propertyId: property.id, value: next };
    page.dispatch(setRowValue.create(change));
  };
  const items = options.map((option): MenuItem => ({
    label: option.name,
    color: option.color,
    check: "box",
    isChecked: chosen.includes(option.id),
    keepsOpen: true,
    onSelect: () => {
      set(
        chosen.includes(option.id)
          ? chosen.filter((id) => id !== option.id)
          : [...chosen, option.id],
      );
    },
  }));
  const chips = options
    .filter((option) => chosen.includes(option.id))
    .map((option) => renderChip(option.name, option.color));
  const display = chips.length === 0 ? renderEmpty() : html`${chips}`;
  return renderOpener({ row, property, page }, { display, menu: { items } });
}

function renderDate(
  row: PageBlock,
  property: PropertyDefinition,
  page: RowPage,
): TemplateResult {
  const value = valueOf(row, property, page);
  // Shown in the property's date format, as the table shows it.
  const shown =
    value === undefined
      ? renderEmpty()
      : html`${propertyType(property.type).renderCell(value, property)}`;
  const clear: MenuItem = {
    label: TEXT.clearDate,
    icon: "trash",
    onSelect: () => {
      const change = {
        rowId: row.id,
        propertyId: property.id,
        value: undefined,
      };
      page.dispatch(setRowValue.create(change));
    },
  };
  return renderOpener(
    { row, property, page },
    {
      display: shown,
      menu: { lead: renderDateRange(value, property), items: [clear] },
    },
  );
}

function renderText(
  row: PageBlock,
  property: PropertyDefinition,
  page: RowPage,
): TemplateResult {
  const type = propertyType(property.type);
  return html`<input
    class="database__row-input"
    type=${type.input?.type ?? "text"}
    inputmode=${type.input?.mode ?? nothing}
    aria-label=${property.name}
    placeholder=${TEXT.emptyValue}
    .value=${type.format(valueOf(row, property, page), property)}
  />`;
}

// Values the app keeps or works out, such as a formula's, are only shown.
function renderShown(
  row: PageBlock,
  property: PropertyDefinition,
  page: RowPage,
): TemplateResult {
  const type = propertyType(property.type);
  const shown = type.renderCell(valueOf(row, property, page), property);
  return html`<output class="database__row-shown">${shown}</output>`;
}

type ValueRenderer = (
  row: PageBlock,
  property: PropertyDefinition,
  page: RowPage,
) => TemplateResult;

const BY_TYPE: Readonly<Partial<Record<string, ValueRenderer>>> = {
  "multi-select": renderTags,
  date: renderDate,
};

const BY_EDITOR: Readonly<Partial<Record<string, ValueRenderer>>> = {
  files: renderRowFiles,
  relation: renderRowRelation,
  button: renderRowButton,
  options: renderOptionChoice,
  none: renderShown,
  toggle: (row, property, page) =>
    html`<input
      type="checkbox"
      class=${CHECKBOX_CLASS}
      aria-label=${property.name}
      .checked=${valueOf(row, property, page) === true}
    />`,
};

export function renderRowValue(
  row: PageBlock,
  property: PropertyDefinition,
  page: RowPage,
): TemplateResult {
  const type = propertyType(property.type);
  const render =
    BY_TYPE[property.type] ??
    (type.compute === undefined ? BY_EDITOR[type.editor] : renderShown) ??
    renderText;
  return render(row, property, page);
}
