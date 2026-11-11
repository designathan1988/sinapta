// Chooses which of the table's menus and popovers is open.
import "./database-menus.css";
import { nothing, type TemplateResult } from "lit-html";
import { renderCellFiles } from "./cell-files.view.ts";
import { renderCellRelation } from "./cell-relation.view.ts";
import { renderCellOptions } from "./cell-options.view.ts";
import { renderColumnMenu, renderTypeMenu } from "./column-menu.view.ts";
import {
  PROPERTY_EDIT_OVERLAY,
  renderPropertyEdit,
} from "./property-edit.view.ts";
import {
  CELL_FILES_OVERLAY,
  CELL_OPTIONS_OVERLAY,
  CELL_RELATION_OVERLAY,
  type TableContext,
} from "./table-cell.view.ts";
import {
  COLUMN_MENU_OVERLAY,
  PROPERTY_TYPES_OVERLAY,
} from "./table-header.view.ts";
import { renderFilters } from "./view-filters.view.ts";
import { BULK_EDIT_OVERLAY, renderBulkEdit } from "./table-bulk-edit.view.ts";
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
  [CELL_RELATION_OVERLAY]: renderCellRelation,
  [FILTERS_OVERLAY]: renderFilters,
  [BULK_EDIT_OVERLAY]: renderBulkEdit,
  [PROPERTIES_OVERLAY]: renderProperties,
  [NEW_VIEW_OVERLAY]: renderNewViewMenu,
  [PROPERTY_EDIT_OVERLAY]: renderPropertyEdit,
};

// Overlays of a whole database, opened from its toolbar or header; they
// carry the database's id, so that two databases on one page do not both
// show them.
const DATABASE_OVERLAYS: ReadonlySet<string> = new Set([
  PROPERTY_TYPES_OVERLAY,
  FILTERS_OVERLAY,
  PROPERTIES_OVERLAY,
  NEW_VIEW_OVERLAY,
]);

export function renderTableOverlay(
  context: TableContext,
): TemplateResult | typeof nothing {
  const overlay = context.state.ui.overlay;
  const kind = overlay?.kind ?? "";
  const isOther =
    DATABASE_OVERLAYS.has(kind) && overlay?.anchorId !== context.model.holderId;
  return isOther ? nothing : (OVERLAYS[kind]?.(context) ?? nothing);
}
