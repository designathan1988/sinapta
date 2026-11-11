// The layout panel: a tile per layout, the chosen one ringed in blue,
// then the chosen layout's own settings.
import { html, type TemplateResult } from "lit-html";
import type { ViewType } from "../../../model/index.ts";
import { COPY } from "../../../ui/copy.ts";
import { renderIcon } from "../../../ui/icon/index.ts";
import type { MenuEntry } from "../../../ui/menu/index.ts";
import { setCardOptions } from "../card.commands.ts";
import type { TableContext } from "../table-cell.view.ts";
import { setViewType } from "../view-layout.commands.ts";
import { LAYOUT_ICONS } from "./root-panel.view.ts";
import { panelRow, type SettingsPanel } from "./settings-panel.ts";

const LAYOUTS: readonly ViewType[] = [
  "table",
  "board",
  "gallery",
  "list",
  "calendar",
];

function renderTiles(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  const viewId = model.view.id;
  return html`<div
    class="view-settings__tiles"
    role="group"
    aria-label=${COPY.database.layout}
  >
    ${LAYOUTS.map(
      (viewType) =>
        html`<button
          type="button"
          class="view-settings__tile"
          aria-pressed=${String(viewType === model.view.type)}
          @click=${() => dispatch(setViewType.create({ viewId, viewType }))}
        >
          ${renderIcon(LAYOUT_ICONS[viewType])}
          <span>${COPY.database.layouts[viewType]}</span>
        </button>`,
    )}
  </div>`;
}

function cardItems(context: TableContext): MenuEntry[] {
  const { view } = context.model;
  const { cardPreviews, cardSizes } = COPY.database;
  const colorColumns: MenuEntry = {
    label: COPY.database.colorColumns,
    check: "switch",
    isChecked: view.colorColumns,
    onSelect: () =>
      context.dispatch(
        setCardOptions.create({
          viewId: view.id,
          options: { colorColumns: !view.colorColumns },
        }),
      ),
  };
  return [
    panelRow(
      context,
      {
        label: COPY.database.cardPreview,
        value: cardPreviews[view.cardPreview],
      },
      "card-preview",
    ),
    panelRow(
      context,
      { label: COPY.database.cardSize, value: cardSizes[view.cardSize] },
      "card-size",
    ),
    ...(view.type === "board" ? [colorColumns] : []),
  ];
}

function layoutItems(context: TableContext): MenuEntry[] {
  const { view, database } = context.model;
  if (view.type === "board" || view.type === "gallery") {
    return cardItems(context);
  }
  if (view.type !== "calendar") return [];
  const date = database.props.properties.find(
    (property) => property.id === view.datePropertyId,
  );
  return [
    panelRow(
      context,
      {
        label: COPY.database.calendarBy,
        icon: "calendar",
        value: date?.name ?? COPY.database.noGrouping,
      },
      "calendar-date",
    ),
  ];
}

export function layoutPanel(context: TableContext): SettingsPanel {
  return {
    title: COPY.database.layout,
    back: null,
    lead: renderTiles(context),
    items: layoutItems(context),
  };
}
