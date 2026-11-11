// How a view lays out its rows: the layout itself, the menu that creates a
// view of a chosen layout, and the layout settings in the view's popover.
import { html, nothing, type TemplateResult } from "lit-html";
import type { ViewType } from "../../model/index.ts";
import { closeOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderMenu, type MenuItem } from "../../ui/menu/index.ts";
import { renderBoard } from "./layouts/board/index.ts";
import { renderCalendar } from "./layouts/calendar/index.ts";
import { renderGallery } from "./layouts/gallery/index.ts";
import { renderList } from "./layouts/list/index.ts";
import type { TableContext } from "./table-cell.view.ts";
import { renderTable } from "./table.view.ts";
import {
  DATE_PROPERTY_TYPES,
  GROUP_PROPERTY_TYPES,
  propertiesOfTypes,
  setViewDateProperty,
  setViewGroupProperty,
  setViewType,
} from "./view-layout.commands.ts";
import { createView } from "./view.commands.ts";

export const NEW_VIEW_OVERLAY = "new-view";

const LAYOUTS: readonly ViewType[] = [
  "table",
  "board",
  "gallery",
  "list",
  "calendar",
];

const RENDERERS: Record<ViewType, (context: TableContext) => TemplateResult> = {
  table: renderTable,
  board: renderBoard,
  gallery: renderGallery,
  list: renderList,
  calendar: renderCalendar,
};

export function renderLayout(context: TableContext): TemplateResult {
  return RENDERERS[context.model.view.type](context);
}

export function renderNewViewMenu(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  const databaseId = model.database.id;
  const items = LAYOUTS.map((viewType): MenuItem => ({
    label: COPY.database.layouts[viewType],
    onSelect: () => {
      const name = COPY.database.layouts[viewType];
      dispatch(createView.create({ databaseId, name, viewType }));
    },
  }));
  return renderMenu({
    label: COPY.database.newView,
    items,
    onClose: () => dispatch(closeOverlay.create({})),
  });
}

function isViewType(value: string): value is ViewType {
  return LAYOUTS.some((layout) => layout === value);
}

interface PropertyChoice {
  readonly label: string;
  readonly propertyTypes: readonly string[];
  readonly current: string | undefined;
  readonly onChoose: (propertyId: string) => void;
}

function renderPropertyChoice(
  context: TableContext,
  choice: PropertyChoice,
): TemplateResult {
  const properties = propertiesOfTypes(
    context.model.database,
    choice.propertyTypes,
  );
  return html`<label class="database__view-name">
    ${choice.label}
    <select
      class="database__field"
      @change=${(event: Event) => {
        if (event.target instanceof HTMLSelectElement)
          choice.onChoose(event.target.value);
      }}
    >
      ${
        choice.current === undefined
          ? html`<option value="" selected></option>`
          : nothing
      }
      ${properties.map(
        (property) =>
          html`<option
            value=${property.id}
            ?selected=${property.id === choice.current}
          >
            ${property.name}
          </option>`,
      )}
    </select>
  </label>`;
}

function renderLayoutProperty(context: TableContext) {
  const { model, dispatch } = context;
  const { view } = model;
  const viewId = view.id;
  const propertyOf = (id: string) =>
    model.database.props.properties.find((property) => property.id === id)?.id;
  if (view.type === "board") {
    return renderPropertyChoice(context, {
      label: COPY.database.groupBy,
      propertyTypes: GROUP_PROPERTY_TYPES,
      current: view.groupPropertyId,
      onChoose: (id) => {
        const propertyId = propertyOf(id);
        if (propertyId !== undefined)
          dispatch(setViewGroupProperty.create({ viewId, propertyId }));
      },
    });
  }
  if (view.type !== "calendar") return nothing;
  return renderPropertyChoice(context, {
    label: COPY.database.dateBy,
    propertyTypes: DATE_PROPERTY_TYPES,
    current: view.datePropertyId,
    onChoose: (id) => {
      const propertyId = propertyOf(id);
      if (propertyId !== undefined)
        dispatch(setViewDateProperty.create({ viewId, propertyId }));
    },
  });
}

export function renderLayoutSettings(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  const viewId = model.view.id;
  const onChange = (event: Event): void => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    const viewType = event.target.value;
    if (isViewType(viewType))
      dispatch(setViewType.create({ viewId, viewType }));
  };
  return html`<label class="database__view-name">
      ${COPY.database.layout}
      <select class="database__field" @change=${onChange}>
        ${LAYOUTS.map(
          (layout) =>
            html`<option
              value=${layout}
              ?selected=${layout === model.view.type}
            >
              ${COPY.database.layouts[layout]}
            </option>`,
        )}
      </select>
    </label>
    ${renderLayoutProperty(context)}`;
}
