// Chooses which of the table's menus and popovers is open.
import "./database-menus.css";
import { nothing, type TemplateResult } from "lit-html";
import { renderCellFiles } from "./cell-files.view.ts";
import { renderCellRelation } from "./cell-relation.view.ts";
import { renderCellOptions } from "./cell-options.view.ts";
import { renderColumnMenu, renderTypeMenu } from "./column-menu.view.ts";
import { GROUP_MENU_OVERLAY } from "./group-actions.ts";
import { renderGroupMenu } from "./group-menu.view.ts";
import {
  CELL_FILES_OVERLAY,
  CELL_OPTIONS_OVERLAY,
  CELL_RELATION_OVERLAY,
  type TableContext,
} from "./table-cell.view.ts";
import { COLUMN_MENU_OVERLAY } from "./database-overlay.ts";
import { PROPERTY_TYPES_OVERLAY } from "./table-header.view.ts";
import { FILTERS_OVERLAY, renderFilters } from "./view-filters.view.ts";
import {
  renderViewSettings,
  VIEW_SETTINGS_OVERLAY,
} from "./view-settings/index.ts";
import {
  BOARD_COLUMN_OVERLAY,
  renderBoardColumnMenu,
} from "./layouts/board/index.ts";
import { BULK_EDIT_OVERLAY, renderBulkEdit } from "./table-bulk-edit.view.ts";
import { NEW_VIEW_OVERLAY, renderNewViewMenu } from "./view-layout.view.ts";

export { FILTERS_OVERLAY } from "./view-filters.view.ts";
export { VIEW_SETTINGS_OVERLAY } from "./view-settings/index.ts";

type Render = (context: TableContext) => TemplateResult | typeof nothing;

const OVERLAYS: Record<string, Render> = {
  [COLUMN_MENU_OVERLAY]: renderColumnMenu,
  [PROPERTY_TYPES_OVERLAY]: renderTypeMenu,
  [CELL_OPTIONS_OVERLAY]: renderCellOptions,
  [CELL_FILES_OVERLAY]: renderCellFiles,
  [CELL_RELATION_OVERLAY]: renderCellRelation,
  [FILTERS_OVERLAY]: renderFilters,
  [BULK_EDIT_OVERLAY]: renderBulkEdit,
  [BOARD_COLUMN_OVERLAY]: renderBoardColumnMenu,
  [VIEW_SETTINGS_OVERLAY]: renderViewSettings,
  [GROUP_MENU_OVERLAY]: renderGroupMenu,
  [NEW_VIEW_OVERLAY]: renderNewViewMenu,
};

// Overlays of a whole database, opened from its toolbar or header; they
// carry the database's id, so that two databases on one page do not both
// show them.
const DATABASE_OVERLAYS: ReadonlySet<string> = new Set([
  PROPERTY_TYPES_OVERLAY,
  FILTERS_OVERLAY,
  VIEW_SETTINGS_OVERLAY,
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
