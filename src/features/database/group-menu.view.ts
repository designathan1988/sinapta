// The menu of a group of rows in a table or list, opened from the "…" on
// its header, as Notion's: for now, hiding the group.
import { nothing, type TemplateResult } from "lit-html";
import { closeOverlay } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderMenu } from "../../ui/menu/index.ts";
import { groupKeyOf } from "./group-actions.ts";
import { toggleGroupHidden } from "./group.commands.ts";
import { selectRowGroups } from "./row-groups.selectors.ts";
import type { TableContext } from "./table-cell.view.ts";

export function renderGroupMenu(
  context: TableContext,
): TemplateResult | typeof nothing {
  const { model, state, dispatch } = context;
  const key = groupKeyOf(model.holderId, state.ui.overlay?.anchorId ?? "");
  const group = selectRowGroups(model)?.groups.find((one) => one.key === key);
  if (key === undefined || group === undefined) return nothing;
  const viewId = model.view.id;
  return renderMenu({
    label: COPY.database.groupActions(group.label),
    items: [
      {
        label: COPY.database.hideGroup,
        icon: "eye-off",
        onSelect: () => dispatch(toggleGroupHidden.create({ viewId, key })),
      },
    ],
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
