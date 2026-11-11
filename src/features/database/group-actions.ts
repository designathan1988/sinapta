// What a group of rows can do besides collapsing: add a row that takes
// the group's value, and open the group's menu, anchored to its "…".
import { withDefaultTemplate } from "./template.commands.ts";
import {
  groupValues,
  selectRowGroups,
  type RowGroup,
} from "./row-groups.selectors.ts";
import { addRow } from "./row.commands.ts";
import type { TableContext } from "./table-cell.view.ts";

export const GROUP_MENU_OVERLAY = "group-menu";

const SEPARATOR = "|group|";

// The anchor of a group's menu names the database and the group, as two
// views on one page may share group keys.
export function groupMenuAnchor(holderId: string, key: string): string {
  return `${holderId}${SEPARATOR}${key}`;
}

// The group's key when the anchor is a group menu's of this holder.
export function groupKeyOf(
  holderId: string,
  anchorId: string,
): string | undefined {
  const prefix = groupMenuAnchor(holderId, "");
  return anchorId.startsWith(prefix)
    ? anchorId.slice(prefix.length)
    : undefined;
}

export function addRowInGroup(group: RowGroup, context: TableContext): void {
  const { model, dispatch } = context;
  const grouped = selectRowGroups(model);
  const values = grouped === undefined ? {} : groupValues(grouped, group.key);
  const databaseId = model.database.id;
  dispatch(
    addRow.create(
      withDefaultTemplate(context.state, {
        databaseId,
        values,
        opensPage: true,
        viewId: context.model.view.id,
      }),
    ),
  );
}
