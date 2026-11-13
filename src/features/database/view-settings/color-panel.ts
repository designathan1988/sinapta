// The view settings' "Conditional color" panel, as Notion's: a picture of
// colored rows and the note over "New color setting", which first asks
// for the property to color by; then each rule, and "Add another" under
// them, asking the same.
import { html, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../../blocks/database/index.ts";
import { renderButton } from "../../../ui/button/index.ts";
import { COPY } from "../../../ui/copy.ts";
import type { MenuItem } from "../../../ui/menu/index.ts";
import { addColorRule } from "../color-rules.commands.ts";
import { filterProperties, newFilterFor } from "../filter-fields.ts";
import { propertyIcon, TITLE_PROPERTY_ID } from "../table-model.selectors.ts";
import type { TableContext } from "../table-cell.view.ts";
import { renderColorRule } from "./color-rule.view.ts";
import { goTo, type SettingsPanel } from "./settings-panel.ts";

const TEXT = COPY.database;

// Notion's picture over the note: a sample table, its rows tinted as
// rules would tint them.
const SAMPLE_COLORS = ["green", "", "green", "orange", "red"];

function renderSampleRow(cells: readonly string[], color: string) {
  return html`<span class="view-settings__color-row" data-color=${color}
    >${cells.map((cell) => html`<span>${cell}</span>`)}</span
  >`;
}

function renderPicture(): TemplateResult {
  const { head, rows } = TEXT.colorSample;
  return html`<div class="view-settings__color-picture" aria-hidden="true">
    <span class="view-settings__color-row" data-head
      >${head.map((cell) => html`<span>${cell}</span>`)}</span
    >
    ${rows.map((cells, index) =>
      renderSampleRow(cells, SAMPLE_COLORS[index] ?? ""),
    )}
  </div>`;
}

function renderEmpty(context: TableContext): TemplateResult {
  return html`${renderPicture()}
    <p class="view-settings__note">${TEXT.conditionalColorNote}</p>
    ${renderButton({
      label: TEXT.newColorSetting,
      icon: "plus",
      variant: "primary",
      // A panel without rows: its button takes the keys.
      takesFocus: true,
      onClick: () => {
        goTo(context, COLOR_PROPERTY_PANEL);
      },
    })}`;
}

function renderLead(context: TableContext): TemplateResult {
  const rules = context.model.view.colorRules ?? [];
  if (rules.length === 0) {
    return html`<div class="view-settings__colors">
      ${renderEmpty(context)}
    </div>`;
  }
  return html`<div class="view-settings__colors">
    ${rules.map((rule) => renderColorRule(context, rule))}
    ${renderButton({
      label: TEXT.addAnotherColor,
      icon: "plus",
      onClick: () => {
        goTo(context, COLOR_PROPERTY_PANEL);
      },
    })}
  </div>`;
}

export function colorPanel(context: TableContext): SettingsPanel {
  return {
    title: TEXT.conditionalColor,
    back: null,
    items: [],
    lead: renderLead(context),
  };
}

export const COLOR_PROPERTY_PANEL = "color-property";

// Names in character order, as Notion's lists of properties.
function byName(a: PropertyDefinition, b: PropertyDefinition): number {
  if (a.name === b.name) return 0;
  return a.name < b.name ? -1 : 1;
}

function propertyItem(
  context: TableContext,
  property: PropertyDefinition,
): MenuItem {
  return {
    label: property.name,
    icon: propertyIcon(property),
    keepsOpen: true,
    onSelect: () => {
      const viewId = context.model.view.id;
      const condition = newFilterFor(property, context);
      context.dispatch(addColorRule.create({ viewId, condition }));
      goTo(context, "color");
    },
  };
}

// "Search for a property": the title first, the others by name; the one
// chosen makes a rule colored green, as Notion's.
export function colorPropertyPanel(context: TableContext): SettingsPanel {
  const properties = filterProperties(context);
  const isTitle = (property: PropertyDefinition) =>
    property.id === TITLE_PROPERTY_ID;
  const ordered = [
    ...properties.filter(isTitle),
    ...properties.filter((property) => !isTitle(property)).sort(byName),
  ];
  return {
    title: TEXT.conditionalColor,
    back: "color",
    search: TEXT.searchProperty,
    items: ordered.map((property) => propertyItem(context, property)),
  };
}
