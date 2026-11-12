// The views a database's tabs leave out, listed under "N more…" with
// their layouts' icons; choosing one opens it.
import { type TemplateResult } from "lit-html";
import { closeOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderMenu, type MenuItem } from "../../ui/menu/index.ts";
import type { TableContext } from "./table-cell.view.ts";
import { LAYOUT_ICONS } from "./view-settings/index.ts";
import { splitViews } from "./view-tabs.view.ts";
import { setActiveView } from "./view.commands.ts";

export function renderMoreViews(context: TableContext): TemplateResult {
  const { model, state, dispatch } = context;
  const databaseId = model.holderId;
  const all = model.viewIds.flatMap((id) => state.workspace.views[id] ?? []);
  const { more } = splitViews(all, model.view.id);
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
