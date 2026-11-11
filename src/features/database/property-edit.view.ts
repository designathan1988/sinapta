// The settings of one property: its name, its type's own settings and,
// for a property with options, the options.
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import { closeOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  focusOverlayAnchor,
  showPopoverWhenConnected,
} from "../../ui/overlay/index.ts";
import { changeProperty, setPropertyConfig } from "./database.commands.ts";
import { renderOptionList } from "./option-list.view.ts";
import { propertyType } from "./property-registry.ts";
import type { TableContext } from "./table-cell.view.ts";

export const PROPERTY_EDIT_OVERLAY = "property-edit";

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
  return html`<label class="database__view-name">
    ${COPY.database.propertyName}
    <input
      class="database__field"
      type="text"
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
  return html`<label class="database__view-name">
    ${COPY.database.propertyDescription}
    <textarea
      class="database__field"
      rows="2"
      .value=${property.description ?? ""}
      @change=${onChange}
    ></textarea>
  </label>`;
}

export function renderPropertyEdit(
  context: TableContext,
): TemplateResult | typeof nothing {
  const { model, dispatch, state } = context;
  const anchorId = state.ui.overlay?.anchorId;
  const property = model.database.props.properties.find(
    (item) => item.id === anchorId,
  );
  if (property === undefined) return nothing;
  const close = (): void => {
    focusOverlayAnchor();
    dispatch(closeOverlay.create({}));
  };
  const hasOptions = propertyType(property.type).editor === "options";
  return html`<div
    class="database__popover"
    popover="manual"
    data-overlay
    aria-label=${COPY.database.propertySettings}
    ${ref(showPopoverWhenConnected)}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    }}
  >
    ${renderNameField(property, context)}
    ${renderDescription(property, context)} ${renderConfig(property, context)}
    ${hasOptions ? renderOptionList(property, context) : nothing}
  </div>`;
}
