// The rows a button's "Edit pages in" action changes: the rows of its
// database, templates and trashed pages left out, that pass its filter.
import { selectDatabase } from "../../blocks/database/index.ts";
import {
  selectIsInTrash,
  selectPage,
  selectPageTitle,
} from "../../blocks/page/index.ts";
import { parseBlockId, type BlockId } from "../../model/index.ts";
import type { PressContext } from "./button-values.ts";
import { matchesGroup } from "./filter-match.ts";
import type { ButtonPropertyAction } from "./properties/button/index.ts";
import { TITLE_PROPERTY_ID, titleProperty } from "./table-model.selectors.ts";

export function selectEditedRows(
  press: PressContext,
  action: Extract<ButtonPropertyAction, { kind: "edit-pages" }>,
): BlockId[] {
  const { state, today } = press;
  const database = selectDatabase(
    state,
    parseBlockId(action.databaseId) ?? null,
  );
  if (database === undefined) return [];
  const { templateIds, properties } = database.props;
  const title = titleProperty();
  const context = {
    properties: [...(title === undefined ? [] : [title]), ...properties],
    titleId: TITLE_PROPERTY_ID,
    today,
    state,
  };
  return database.childIds.filter((rowId) => {
    const row = selectPage(state, rowId);
    if (row === undefined || templateIds.includes(rowId)) return false;
    if (selectIsInTrash(state, row)) return false;
    if (action.filter === undefined) return true;
    const values = {
      id: row.id,
      title: selectPageTitle(row),
      values: row.props.values ?? {},
    };
    return matchesGroup(values, action.filter, context);
  });
}
