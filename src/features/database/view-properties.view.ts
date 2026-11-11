// The settings of a view: its name, and the database's properties as the
// view shows them: rename, show or hide in this view, and delete.
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import { closeOverlay } from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import { changeProperty, removeProperty } from "./database.commands.ts";
import type { TableContext } from "./table-cell.view.ts";
import { renderLayoutSettings } from "./view-layout.view.ts";
import {
  deleteView,
  renameView,
  togglePropertyHidden,
} from "./view.commands.ts";

function renderProperty(
  property: PropertyDefinition,
  context: TableContext,
): TemplateResult {
  const { model, dispatch } = context;
  const databaseId = model.database.id;
  const viewId = model.view.id;
  const propertyId = property.id;
  const rename = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const name = event.target.value;
    dispatch(changeProperty.create({ databaseId, propertyId, name }));
  };
  return html`<li class="database__filter">
    <input
      class="database__field"
      type="text"
      aria-label=${COPY.database.propertyName}
      .value=${property.name}
      @change=${rename}
    />
    <label class="database__check">
      <input
        type="checkbox"
        .checked=${!model.view.hiddenPropertyIds.includes(propertyId)}
        @change=${() => dispatch(togglePropertyHidden.create({ viewId, propertyId }))}
      />
      ${COPY.database.showProperty}
    </label>
    ${renderButton({
      label: `${COPY.database.deleteProperty}: ${property.name}`,
      icon: "trash",
      isIconOnly: true,
      variant: "danger",
      onClick: () =>
        dispatch(removeProperty.create({ databaseId, propertyId })),
    })}
  </li>`;
}

// A database keeps at least one view, so the last one cannot be deleted.
function renderDeleteView(
  context: TableContext,
): TemplateResult | typeof nothing {
  const { model, dispatch } = context;
  if (model.database.props.viewIds.length < 2) return nothing;
  return renderButton({
    label: COPY.database.deleteView,
    icon: "trash",
    variant: "danger",
    onClick: () => dispatch(deleteView.create({ viewId: model.view.id })),
  });
}

export function renderProperties(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  // An empty name would leave a tab with nothing to press.
  const renameCurrent = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const name = event.target.value.trim();
    if (name === "") event.target.value = model.view.name;
    else dispatch(renameView.create({ viewId: model.view.id, name }));
  };
  return html`<div
    class="database__popover"
    popover="manual"
    data-overlay
    ${ref(showPopoverWhenConnected)}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch(closeOverlay.create({}));
    }}
  >
    <label class="database__view-name">
      ${COPY.database.viewNameLabel}
      <input
        class="database__field"
        type="text"
        .value=${model.view.name}
        @change=${renameCurrent}
      />
    </label>
    ${renderLayoutSettings(context)}
    <ul class="database__filters">
      ${model.database.props.properties.map((property) => renderProperty(property, context))}
    </ul>
    ${renderDeleteView(context)}
  </div>`;
}
