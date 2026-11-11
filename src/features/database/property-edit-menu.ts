// The column menu's submenus for a property itself, as Notion's: "Edit
// property" with a description, its type's own settings as rows and the
// options of a property with options; and "Change type", the list of
// types with the current one checked.
import { html, nothing, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuItem } from "../../ui/menu/index.ts";
import { changeProperty, setPropertyConfig } from "./database.commands.ts";
import { optionEntries, renderAddOption } from "./option-list.view.ts";
import { PROPERTY_TYPES, propertyType } from "./property-registry.ts";
import { changePropertyType } from "./property-type.commands.ts";
import { selectOptionNamesFor } from "./property-type.selectors.ts";
import type { TableContext } from "./table-cell.view.ts";

// The settings of the property's own type, such as a number's format.
function renderConfig(
  property: PropertyDefinition,
  context: TableContext,
): TemplateResult | typeof nothing {
  const editor = propertyType(property.type).renderConfigEditor;
  if (editor === undefined) return nothing;
  const databaseId = context.model.database.id;
  const propertyId = property.id;
  const { state, dispatch } = context;
  return editor(
    property,
    (config) =>
      dispatch(setPropertyConfig.create({ databaseId, propertyId, config })),
    { databaseId, state, dispatch },
  );
}

function renderDescription(
  property: PropertyDefinition,
  context: TableContext,
): TemplateResult {
  const databaseId = context.model.database.id;
  const propertyId = property.id;
  const onChange = (event: Event): void => {
    if (!(event.target instanceof HTMLTextAreaElement)) return;
    const description = event.target.value;
    context.dispatch(
      changeProperty.create({ databaseId, propertyId, description }),
    );
  };
  return html`<label class="menu__field">
    <textarea
      rows="1"
      aria-label=${COPY.database.propertyDescription}
      placeholder=${COPY.database.addDescription}
      .value=${property.description ?? ""}
      @change=${onChange}
    ></textarea>
  </label>`;
}

export function editPropertyItem(
  property: PropertyDefinition,
  context: TableContext,
): MenuItem {
  const hasOptions = propertyType(property.type).editor === "options";
  const menu = () => ({
    label: COPY.database.propertySettings,
    lead: html`<div class="database__property-settings">
      ${renderDescription(property, context)} ${renderConfig(property, context)}
      ${hasOptions ? renderAddOption(property, context) : nothing}
    </div>`,
    items: hasOptions ? optionEntries(property, context) : [],
  });
  return {
    label: COPY.database.editProperty,
    icon: "sliders",
    submenu: { id: `${property.id}:edit`, menu },
  };
}

export function changeTypeItem(
  property: PropertyDefinition,
  context: TableContext,
): MenuItem {
  const { state, dispatch } = context;
  const databaseId = context.model.database.id;
  const items = PROPERTY_TYPES.map((type): MenuItem => ({
    label: type.label,
    icon: type.icon,
    check: "radio",
    isChecked: type.type === property.type,
    onSelect: () => {
      const change = {
        databaseId,
        propertyId: property.id,
        propertyType: type.type,
      };
      const optionNames = selectOptionNamesFor(state, change);
      dispatch(changePropertyType.create({ ...change, optionNames }));
    },
  }));
  return {
    label: COPY.database.changeType,
    icon: "swap",
    submenu: {
      id: `${property.id}:type`,
      menu: () => ({ label: COPY.database.changeType, items }),
    },
  };
}
