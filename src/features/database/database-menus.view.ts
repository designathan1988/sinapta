// Chooses which of the table's menus and popovers is open.
import "./database-menus.css";
import { nothing, type TemplateResult } from "lit-html";
import { renderCellDate } from "./cell-date.view.ts";
import { renderMoreViews, renderViewList } from "./more-views.view.ts";
import {
  renderTemplatesMenu,
  TEMPLATES_OVERLAY,
} from "./templates-menu.view.ts";
import {
  VIEW_LIST_OVERLAY,
  VIEW_TAB_MENU_OVERLAY,
  VIEW_TABS_OVERLAY,
} from "./view-tabs.view.ts";
import { renderViewTabMenu } from "./view-tab-menu.view.ts";
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
  CELL_DATE_OVERLAY,
  type TableContext,
} from "./table-cell.view.ts";
import { COLUMN_MENU_OVERLAY } from "./database-overlay.ts";
import { PROPERTY_TYPES_OVERLAY } from "./table-header.view.ts";
import { FILTERS_OVERLAY, renderFilters } from "./view-filters.view.ts";
import {
  isSimpleFilter,
  VIEW_FILTER_RULE_OVERLAY,
} from "./filter-rule-anchor.ts";
import { renderFilterRule } from "./filter-rule.view.ts";
import { renderFilterStart } from "./filter-start.view.ts";
import {
  VIEW_FILTER_ADD_OVERLAY,
  VIEW_FILTER_PILL_OVERLAY,
  VIEW_SORT_PILL_OVERLAY,
} from "./view-pills.view.ts";
import {
  renderViewSettings,
  VIEW_SETTINGS_OVERLAY,
  VIEW_SORTS_OVERLAY,
} from "./view-settings/index.ts";
import {
  BOARD_COLUMN_OVERLAY,
  renderBoardColumnMenu,
} from "./layouts/board/index.ts";
import { BULK_EDIT_OVERLAY, renderBulkEdit } from "./table-bulk-edit.view.ts";
import { NEW_VIEW_OVERLAY, renderNewViewMenu } from "./view-layout.view.ts";
import {
  VALUE_COMPOSER_OVERLAY,
  VALUE_DISCUSSIONS_OVERLAY,
} from "../comments/index.ts";
import { renderCellComments } from "./cell-actions.view.ts";

export { FILTERS_OVERLAY } from "./view-filters.view.ts";
export {
  VIEW_SETTINGS_OVERLAY,
  VIEW_SORTS_OVERLAY,
} from "./view-settings/index.ts";

type Render = (context: TableContext) => TemplateResult | typeof nothing;

// "Add filter" lists the properties for a new rule, as Notion's; an
// advanced filter adds its rules in its own editor.
function renderFilterAdd(context: TableContext): TemplateResult {
  return isSimpleFilter(context.model.view.filter)
    ? renderFilterStart(context)
    : renderFilters(context);
}

const OVERLAYS: Record<string, Render> = {
  [COLUMN_MENU_OVERLAY]: renderColumnMenu,
  [PROPERTY_TYPES_OVERLAY]: renderTypeMenu,
  [CELL_OPTIONS_OVERLAY]: renderCellOptions,
  [CELL_FILES_OVERLAY]: renderCellFiles,
  [CELL_RELATION_OVERLAY]: renderCellRelation,
  [CELL_DATE_OVERLAY]: renderCellDate,
  [FILTERS_OVERLAY]: renderFilters,
  [BULK_EDIT_OVERLAY]: renderBulkEdit,
  [BOARD_COLUMN_OVERLAY]: renderBoardColumnMenu,
  [VIEW_SETTINGS_OVERLAY]: renderViewSettings,
  [VIEW_SORTS_OVERLAY]: renderViewSettings,
  [VIEW_SORT_PILL_OVERLAY]: renderViewSettings,
  [VIEW_FILTER_PILL_OVERLAY]: renderFilters,
  [VIEW_FILTER_ADD_OVERLAY]: renderFilterAdd,
  [VIEW_FILTER_RULE_OVERLAY]: renderFilterRule,
  [GROUP_MENU_OVERLAY]: renderGroupMenu,
  [VIEW_TABS_OVERLAY]: renderMoreViews,
  [VIEW_LIST_OVERLAY]: renderViewList,
  [VIEW_TAB_MENU_OVERLAY]: renderViewTabMenu,
  [TEMPLATES_OVERLAY]: renderTemplatesMenu,
  [NEW_VIEW_OVERLAY]: renderNewViewMenu,
  [VALUE_COMPOSER_OVERLAY]: renderCellComments,
  [VALUE_DISCUSSIONS_OVERLAY]: renderCellComments,
};

// Overlays of a whole database, opened from its toolbar or header; they
// carry the database's id, so that two databases on one page do not both
// show them.
const DATABASE_OVERLAYS: ReadonlySet<string> = new Set([
  PROPERTY_TYPES_OVERLAY,
  FILTERS_OVERLAY,
  VIEW_SETTINGS_OVERLAY,
  VIEW_SORTS_OVERLAY,
  VIEW_SORT_PILL_OVERLAY,
  VIEW_FILTER_PILL_OVERLAY,
  VIEW_FILTER_ADD_OVERLAY,
  NEW_VIEW_OVERLAY,
  VIEW_TAB_MENU_OVERLAY,
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
