// A button in each row: pressing it sets some of the row's values or
// opens the row, as its settings say. It holds no value of its own.
import { COPY } from "../../../../ui/copy.ts";
import { html, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import { IS_EMPTY, type PropertyType } from "../../property-definition.ts";
import { renderButtonPropertyConfig } from "./button-property-config.view.ts";
import { readButtonPropertyConfig } from "./button-property.schema.ts";

// The button's label, or the property's name when it has none.
export function buttonLabel(property: PropertyDefinition): string {
  const { label } = readButtonPropertyConfig(property.config);
  return label === "" ? property.name : label;
}

function renderButtonCell(
  _value: unknown,
  property: PropertyDefinition,
): TemplateResult {
  return html`<span class="button-property" data-action="press"
    >${buttonLabel(property)}</span
  >`;
}

export const buttonProperty: PropertyType = {
  type: "button",
  label: COPY.propertyTypes.button,
  icon: "button",
  editor: "button",
  read: () => undefined,
  parse: () => undefined,
  format: (_value, property) => buttonLabel(property),
  compare: () => 0,
  filterOperators: [IS_EMPTY],
  renderCell: renderButtonCell,
  renderConfigEditor: renderButtonPropertyConfig,
};
