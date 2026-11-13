// The menu of a group of rows in a table or list, opened from the "…" on
// its header, as Notion's: hiding the group, and for a group an option
// names, the option's name, Delete and its colors.
import { nothing, type TemplateResult } from "lit-html";
import { closeOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderMenu } from "../../ui/menu/index.ts";
import { groupKeyOf } from "./group-actions.ts";
import { groupMenuParts } from "./group-menu-entries.ts";
import { selectRowGroups } from "./row-groups.selectors.ts";
import type { TableContext } from "./table-cell.view.ts";

export function renderGroupMenu(
  context: TableContext,
): TemplateResult | typeof nothing {
  const { model, state, dispatch } = context;
  const key = groupKeyOf(model.holderId, state.ui.overlay?.anchorId ?? "");
  const group = selectRowGroups(model)?.groups.find((one) => one.key === key);
  if (key === undefined || group === undefined) return nothing;
  return renderMenu({
    label: COPY.database.groupActions(group.label),
    ...groupMenuParts(context, key),
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
