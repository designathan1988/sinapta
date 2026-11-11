// The settings of one property, as Notion's property menu: its name with
// its type's icon, a description, its type's own settings, the options of
// a property with options, and Delete.
import { html, nothing, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import {
  closeOverlay,
  openOverlay,
  openOverlayPanel,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import { renderMenu, type MenuEntry } from "../../ui/menu/index.ts";
import {
  changeProperty,
  removeProperty,
  setPropertyConfig,
} from "./database.commands.ts";
import {
  optionEntries,
  optionOfPanel,
  optionPanel,
  renderAddOption,
} from "./option-list.view.ts";
import { propertyType } from "./property-registry.ts";
import type { TableContext } from "./table-cell.view.ts";
import { COLUMN_MENU_OVERLAY } from "./database-overlay.ts";

export { PROPERTY_EDIT_OVERLAY } from "./database-overlay.ts";

function renderNameField(
  property: PropertyDefinition,
  context: TableContext,
): TemplateResult {
  const databaseId = context.model.database.id;
  const propertyId = property.id;
  const rename = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const name = event.target.value;
    context.dispatch(changeProperty.create({ databaseId, propertyId, name }));
  };
  return html`<label class="menu__field database__property-name">
    ${renderIcon(propertyType(property.type).icon)}
    <input
      type="text"
      aria-label=${COPY.database.propertyName}
      data-autofocus
      .value=${property.name}
      @change=${rename}
    />
  </label>`;
}

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

// After the settings: Delete, as at the end of Notion's property menu.
function actions(
  property: PropertyDefinition,
  context: TableContext,
): MenuEntry[] {
  const databaseId = context.model.database.id;
  const propertyId = property.id;
  return [
    {
      label: COPY.database.deleteProperty,
      icon: "trash",
      isDanger: true,
      onSelect: () =>
        context.dispatch(removeProperty.create({ databaseId, propertyId })),
    },
  ];
}

// One option's panel, reached from the options' rows.
function renderOptionPanel(
  property: PropertyDefinition,
  optionId: string,
  context: TableContext,
): TemplateResult | typeof nothing {
  const panel = optionPanel(property, optionId, context);
  if (panel === undefined) return nothing;
  const { dispatch } = context;
  return renderMenu({
    label: COPY.database.propertySettings,
    title: panel.title,
    onBack: () => dispatch(openOverlayPanel.create({ panel: null })),
    lead: panel.lead,
    items: panel.items,
    onClose: () => dispatch(closeOverlay.create({})),
  });
}

export function renderPropertyEdit(
  context: TableContext,
): TemplateResult | typeof nothing {
  const { model, dispatch, state } = context;
  const { overlay } = state.ui;
  const property = model.database.props.properties.find(
    (item) => item.id === overlay?.anchorId,
  );
  if (property === undefined) return nothing;
  const optionId = optionOfPanel(overlay?.panel);
  if (optionId !== undefined) {
    return renderOptionPanel(property, optionId, context);
  }
  const hasOptions = propertyType(property.type).editor === "options";
  const menu = { kind: COLUMN_MENU_OVERLAY, anchorId: property.id };
  return renderMenu({
    label: COPY.database.propertySettings,
    title: COPY.database.editProperty,
    onBack: () => dispatch(openOverlay.create({ overlay: menu })),
    lead: html`<div class="database__property-settings">
      ${renderNameField(property, context)}
      ${renderDescription(property, context)} ${renderConfig(property, context)}
      ${hasOptions ? renderAddOption(property, context) : nothing}
    </div>`,
    items: [
      ...(hasOptions ? optionEntries(property, context) : []),
      { kind: "divider" },
      ...actions(property, context),
    ],
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
