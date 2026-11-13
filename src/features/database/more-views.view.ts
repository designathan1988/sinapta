// The views a database's tabs leave out, listed under "N more…" with
// their layouts' icons, and every view under the narrow view switch;
// choosing one opens it.
import { type TemplateResult } from "lit-html";
import { closeOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderMenu, type MenuItem } from "../../ui/menu/index.ts";
import type { TableContext } from "./table-cell.view.ts";
import { LAYOUT_ICONS } from "./view-settings/index.ts";
import { splitViews, tabLayout } from "./view-tabs.view.ts";
import { setActiveView } from "./view.commands.ts";

// Every view, the open one checked, as the menu of Notion's view switch.
export function renderViewList(context: TableContext): TemplateResult {
  const { model, state, dispatch } = context;
  const databaseId = model.holderId;
  const views = model.viewIds.flatMap((id) => state.workspace.views[id] ?? []);
  const items = views.map((view): MenuItem => ({
    label: view.name,
    icon: LAYOUT_ICONS[view.type],
    check: "radio",
    isChecked: view.id === model.view.id,
    onSelect: () =>
      dispatch(setActiveView.create({ databaseId, viewId: view.id })),
  }));
  return renderMenu({
    label: COPY.database.views,
    items,
    onClose: () => dispatch(closeOverlay.create({})),
  });
}

export function renderMoreViews(context: TableContext): TemplateResult {
  const { model, state, dispatch } = context;
  const databaseId = model.holderId;
  const all = model.viewIds.flatMap((id) => state.workspace.views[id] ?? []);
  const { more } = splitViews(all, model.view.id, tabLayout(context));
  const items = all
    .filter((view) => more.includes(view.id))
    .map((view): MenuItem => ({
      label: view.name,
      icon: LAYOUT_ICONS[view.type],
      onSelect: () =>
        dispatch(setActiveView.create({ databaseId, viewId: view.id })),
    }));
  return renderMenu({
    label: COPY.database.views,
    items,
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
