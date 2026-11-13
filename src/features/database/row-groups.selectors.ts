// The groups of a grouped view: the rows the view shows, put in the
// groups of their value of the grouping property. Every layout reads
// them, and the table also moves through rows in their order.
import type {
  DatabaseBlock,
  PropertyDefinition,
} from "../../blocks/database/index.ts";
import type { GroupBy } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  EMPTY_GROUP_KEY,
  type GroupKey,
  type Grouping,
} from "./grouping-definition.ts";
import {
  compareText,
  type CellEditor,
  type PropertyType,
} from "./property-definition.ts";
import { propertyType } from "./property-registry.ts";
import { cellValue } from "./filter-match.ts";
import {
  TITLE_PROPERTY_ID,
  titleProperty,
  type TableModel,
  type TableRow,
} from "./table-model.selectors.ts";

export interface RowGroup {
  readonly key: string;
  readonly label: string;
  readonly color?: string;
  readonly rows: readonly TableRow[];
  readonly isCollapsed: boolean;
  // Hidden groups are listed apart, and their rows are not shown.
  readonly isHidden: boolean;
}

export interface GroupedRows {
  readonly property: PropertyDefinition;
  readonly groups: readonly RowGroup[];
  readonly grouping: Grouping;
}

// Values these types hold cannot be told apart by their text.
const UNGROUPABLE = new Set<CellEditor>(["files", "relation", "button"]);

export function isGroupable(property: PropertyDefinition): boolean {
  const type = propertyType(property.type);
  return type.grouping !== undefined || !UNGROUPABLE.has(type.editor);
}

// What a view can group by, as Notion's: the title column first, then
// the database's properties that can group.
export function groupableProperties(
  database: DatabaseBlock,
): PropertyDefinition[] {
  const title = titleProperty();
  const all = title === undefined ? [] : [title];
  return [...all, ...database.props.properties].filter(isGroupable);
}

// The property a grouping names, the title column included.
export function groupPropertyOf(
  database: DatabaseBlock,
  propertyId: string | undefined,
): PropertyDefinition | undefined {
  return groupableProperties(database).find((item) => item.id === propertyId);
}

// Without a grouping of its own, a type groups by its value's text.
function groupingOf(type: PropertyType): Grouping {
  if (type.grouping !== undefined) return type.grouping;
  return {
    keysOf(value, property) {
      const text = type.format(value, property);
      return text === "" ? [] : [{ key: text, label: text }];
    },
  };
}

interface Bucket {
  readonly group: GroupKey;
  readonly rows: TableRow[];
}

function bucketRows(
  model: TableModel,
  property: PropertyDefinition,
  groupBy: GroupBy,
): Map<string, Bucket> {
  const type = propertyType(property.type);
  const grouping = groupingOf(type);
  const empty = { key: EMPTY_GROUP_KEY, label: "" };
  const buckets = new Map<string, Bucket>();
  const add = (group: GroupKey, row?: TableRow): void => {
    const bucket = buckets.get(group.key) ?? { group, rows: [] };
    if (row !== undefined) bucket.rows.push(row);
    buckets.set(group.key, bucket);
  };
  if (grouping.keepsEmptyGroup === true) add(empty);
  for (const known of grouping.known?.(property) ?? []) add(known);
  for (const row of model.rows) {
    const value = cellValue(row, property, TITLE_PROPERTY_ID);
    const keys =
      value === undefined ? [] : grouping.keysOf(value, property, groupBy);
    if (keys.length === 0) add(empty, row);
    for (const key of keys) add(key, row);
  }
  return buckets;
}

function byName(a: Bucket, b: Bucket): number {
  return compareText(
    a.group.sortValue ?? a.group.label,
    b.group.sortValue ?? b.group.label,
  );
}

// The group of empty values first; the others in the property's order,
// then by name, unless sorted by name both ways.
interface Order {
  readonly knownCount: number;
  readonly sort: GroupBy["sort"];
  // Text puts its empty group last, as Notion's "No Name".
  readonly isEmptyLast: boolean;
}

function sortedRest(rest: Bucket[], order: Order): Bucket[] {
  if (order.sort === "ascending") return rest.sort(byName);
  if (order.sort === "descending") return rest.sort(byName).reverse();
  const known = rest.slice(0, order.knownCount);
  return [...known, ...rest.slice(order.knownCount).sort(byName)];
}

function orderBuckets(buckets: Map<string, Bucket>, order: Order): Bucket[] {
  const all = [...buckets.values()];
  const empty = all.filter((bucket) => bucket.group.key === EMPTY_GROUP_KEY);
  const rest = all.filter((bucket) => bucket.group.key !== EMPTY_GROUP_KEY);
  const sorted = sortedRest(rest, order);
  return order.isEmptyLast ? [...sorted, ...empty] : [...empty, ...sorted];
}

// Groups placed by hand come first, in that order; the others keep theirs.
function placeByHand(
  buckets: readonly Bucket[],
  order: readonly string[],
): Bucket[] {
  const rank = (bucket: Bucket): number => {
    const index = order.indexOf(bucket.group.key);
    return index === -1 ? order.length : index;
  };
  return buckets
    .map((bucket, index) => ({ bucket, index }))
    .sort((a, b) => rank(a.bucket) - rank(b.bucket) || a.index - b.index)
    .map(({ bucket }) => bucket);
}

function groupRows(model: TableModel): GroupedRows | undefined {
  return groupRowsBy(model, model.view.groupBy);
}

// The rows grouped as a grouping says, such as a chart's by its axis.
export function groupRowsBy(
  model: TableModel,
  groupBy: GroupBy | undefined,
): GroupedRows | undefined {
  const property = groupPropertyOf(model.database, groupBy?.propertyId);
  if (groupBy === undefined || property === undefined) return undefined;
  const grouping = groupingOf(propertyType(property.type));
  const buckets = bucketRows(model, property, groupBy);
  const knownCount = grouping.known?.(property).length ?? 0;
  const isEmptyLast = grouping.isEmptyLast === true;
  const order = { knownCount, sort: groupBy.sort, isEmptyLast };
  const ordered = orderBuckets(buckets, order);
  const placed =
    groupBy.sort === "manual" ? placeByHand(ordered, groupBy.order) : ordered;
  const groups = placed
    .filter((bucket) => !groupBy.hideEmpty || bucket.rows.length > 0)
    .map(({ group, rows }) => ({
      ...group,
      label:
        group.key === EMPTY_GROUP_KEY
          ? `${COPY.database.noValue} ${property.name}`
          : group.label,
      rows,
      isCollapsed: groupBy.collapsed.includes(group.key),
      isHidden: groupBy.hidden.includes(group.key),
    }));
  return { property, groups, grouping };
}

const groupCache = new WeakMap<TableModel, GroupedRows | null>();

// Undefined when the view does not group, or its property is gone.
export function selectRowGroups(model: TableModel): GroupedRows | undefined {
  const cached = groupCache.get(model);
  if (cached !== undefined) return cached ?? undefined;
  const grouped = groupRows(model);
  groupCache.set(model, grouped ?? null);
  return grouped;
}

const visibleCache = new WeakMap<TableModel, readonly TableRow[]>();

// The rows in the order a grouped view shows them, each once, without
// the rows of collapsed or hidden groups.
export function selectVisibleRows(model: TableModel): readonly TableRow[] {
  const grouped = selectRowGroups(model);
  if (grouped === undefined) return model.rows;
  const cached = visibleCache.get(model);
  if (cached !== undefined) return cached;
  const shown = grouped.groups.filter(
    (group) => !group.isCollapsed && !group.isHidden,
  );
  const unique = new Map(
    shown.flatMap((group) => group.rows).map((row) => [row.id, row]),
  );
  // A Map keeps each key where it was first set.
  const rows = [...unique.values()];
  visibleCache.set(model, rows);
  return rows;
}

// The values a row added to a group starts with: the group's value, when
// rows can move into the group.
export function groupValues(
  grouped: GroupedRows,
  key: string,
): Record<string, unknown> {
  const value = grouped.grouping.valueFor?.(key);
  return value === undefined ? {} : { [grouped.property.id]: value };
}
