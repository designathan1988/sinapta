// How a view lays out its rows: the layout itself, and the menu that
// creates a view of a chosen layout.
import type { TemplateResult } from "lit-html";
import { VIEW_TYPES, type ViewType } from "../../model/index.ts";
import { closeOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderMenu, type MenuItem } from "../../ui/menu/index.ts";
import { renderBoard } from "./layouts/board/index.ts";
import { renderChart } from "./layouts/chart/index.ts";
import { renderFeed } from "./layouts/feed/index.ts";
import { renderForm } from "./layouts/form/index.ts";
import { renderCalendar } from "./layouts/calendar/index.ts";
import { renderGallery } from "./layouts/gallery/index.ts";
import { renderList } from "./layouts/list/index.ts";
import { renderTimeline } from "./layouts/timeline/index.ts";
import type { TableContext } from "./table-cell.view.ts";
import { renderTable } from "./table.view.ts";
import { LAYOUT_ICONS } from "./layout-icons.ts";
import { createView } from "./view.commands.ts";

export const NEW_VIEW_OVERLAY = "new-view";

const RENDERERS: Record<ViewType, (context: TableContext) => TemplateResult> = {
  table: renderTable,
  board: renderBoard,
  gallery: renderGallery,
  list: renderList,
  calendar: renderCalendar,
  timeline: renderTimeline,
  chart: renderChart,
  form: renderForm,
  feed: renderFeed,
};

export function renderLayout(context: TableContext): TemplateResult {
  return RENDERERS[context.model.view.type](context);
}

export function renderNewViewMenu(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  // A new view goes to the database or the linked view showing it.
  const databaseId = model.holderId;
  const items = VIEW_TYPES.map((viewType): MenuItem => ({
    label: COPY.database.layouts[viewType],
    icon: LAYOUT_ICONS[viewType],
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
