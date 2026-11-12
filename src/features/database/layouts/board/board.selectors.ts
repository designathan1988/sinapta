// The columns of a board: the groups of the view's grouping, each holding
// the rows the view shows in the view's order. A board always groups: a
// board saved without a grouping groups by its first status or select.
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import type { BlockId } from "../../../../model/index.ts";
import { groupByProperty } from "../../group.commands.ts";
import { selectRowGroups, type RowGroup } from "../../row-groups.selectors.ts";
import type { TableModel } from "../../table-model.selectors.ts";
import {
  GROUP_PROPERTY_TYPES,
  propertiesOfTypes,
} from "../../view-layout.commands.ts";

export type BoardColumn = RowGroup;

export interface BoardModel {
  readonly property: PropertyDefinition;
  readonly columns: readonly BoardColumn[];
  // The value a card takes in a column; absent when cards cannot move,
  // as between the groups of a date.
  readonly valueFor?: (key: string) => unknown;
}

// The view's group property, or the first status or select property when
// the view has none yet.
export function selectGroupProperty(
  model: TableModel,
): PropertyDefinition | undefined {
  const id = model.view.groupBy?.propertyId;
  const { properties } = model.database.props;
  const grouped = properties.find((property) => property.id === id);
  return grouped ?? propertiesOfTypes(model.database, GROUP_PROPERTY_TYPES)[0];
}

function withGrouping(model: TableModel): TableModel {
  if (model.view.groupBy !== undefined) return model;
  const property = selectGroupProperty(model);
  if (property === undefined) return model;
  const groupBy = groupByProperty(property.id);
  return { ...model, view: { ...model.view, groupBy } };
}

export function selectBoard(model: TableModel): BoardModel | undefined {
  const grouped = selectRowGroups(withGrouping(model));
  if (grouped === undefined) return undefined;
  const { property, groups, grouping } = grouped;
  return {
    property,
    columns: groups,
    ...(grouping.valueFor !== undefined && { valueFor: grouping.valueFor }),
  };
}

export interface BoardLane extends RowGroup {
  readonly columns: readonly BoardColumn[];
}

export interface BoardLanes {
  readonly property: PropertyDefinition;
  readonly lanes: readonly BoardLane[];
  // The value a card takes in a lane; absent when cards cannot move
  // between lanes.
  readonly valueFor?: (key: string) => unknown;
}

// The board's lanes when the view sub-groups: the shown sub-groups, each
// holding every column with the lane's rows.
export function selectBoardLanes(model: TableModel): BoardLanes | undefined {
  const { subGroupBy } = model.view;
  if (subGroupBy === undefined) return undefined;
  const grouped = selectRowGroups({
    ...model,
    view: { ...model.view, groupBy: subGroupBy },
  });
  if (grouped === undefined) return undefined;
  const lanes = grouped.groups
    .filter((group) => !group.isHidden)
    .map((group) => ({
      ...group,
      columns: selectBoard({ ...model, rows: group.rows })?.columns ?? [],
    }));
  const { valueFor } = grouped.grouping;
  return {
    property: grouped.property,
    lanes,
    ...(valueFor !== undefined && { valueFor }),
  };
}

export function selectBoardColumns(
  model: TableModel,
): readonly BoardColumn[] | undefined {
  return selectBoard(model)?.columns;
}

// The key of the column a card moves to when it goes `offset` columns
// over; undefined when there is no column there.
export function selectCardMove(
  columns: readonly BoardColumn[],
  rowId: BlockId,
  offset: number,
): string | undefined {
  const from = columns.findIndex((column) =>
    column.rows.some((row) => row.id === rowId),
  );
  if (from === -1) return undefined;
  return columns[from + offset]?.key;
}
