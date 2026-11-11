// Chooses which of the table's menus and popovers is open.
import "./database-menus.css";
import { nothing, type TemplateResult } from "lit-html";
import { renderCellFiles } from "./cell-files.view.ts";
import { renderCellOptions } from "./cell-options.view.ts";
import { renderColumnMenu, renderTypeMenu } from "./column-menu.view.ts";
import {
  PROPERTY_EDIT_OVERLAY,
  renderPropertyEdit,
} from "./property-edit.view.ts";
import {
  CELL_FILES_OVERLAY,
  CELL_OPTIONS_OVERLAY,
  type TableContext,
} from "./table-cell.view.ts";
import {
  COLUMN_MENU_OVERLAY,
  PROPERTY_TYPES_OVERLAY,
} from "./table-header.view.ts";
import { renderFilters } from "./view-filters.view.ts";
import { NEW_VIEW_OVERLAY, renderNewViewMenu } from "./view-layout.view.ts";
import { renderProperties } from "./view-properties.view.ts";

export const FILTERS_OVERLAY = "filters";
export const PROPERTIES_OVERLAY = "properties";

type Render = (context: TableContext) => TemplateResult | typeof nothing;

const OVERLAYS: Record<string, Render> = {
  [COLUMN_MENU_OVERLAY]: renderColumnMenu,
  [PROPERTY_TYPES_OVERLAY]: renderTypeMenu,
  [CELL_OPTIONS_OVERLAY]: renderCellOptions,
  [CELL_FILES_OVERLAY]: renderCellFiles,
  [FILTERS_OVERLAY]: renderFilters,
  [PROPERTIES_OVERLAY]: renderProperties,
  [NEW_VIEW_OVERLAY]: renderNewViewMenu,
  [PROPERTY_EDIT_OVERLAY]: renderPropertyEdit,
};

export function renderTableOverlay(
  context: TableContext,
): TemplateResult | typeof nothing {
  const kind = context.state.ui.overlay?.kind ?? "";
  return OVERLAYS[kind]?.(context) ?? nothing;
}
