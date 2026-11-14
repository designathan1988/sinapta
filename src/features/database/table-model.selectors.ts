// The rows and columns a table view shows. This is the one module that
// talks to the table engine: it hands the engine the rows and the sort and
// filter settings of the active View record and reads back row models. The
// engine holds no state of its own.
import {
  columnFilteringFeature,
  constructTable,
  createFilteredRowModel,
  createSortedRowModel,
  rowSortingFeature,
  tableFeatures,
  type ColumnDef,
} from "@tanstack/table-core";
import { storeReactivityBindings } from "@tanstack/table-core/store-reactivity-bindings";
import type {
  DatabaseBlock,
  PropertyDefinition,
} from "../../blocks/database/index.ts";
import {
  parsePropertyId,
  type BlockId,
  type PropertyId,
  type View,
  type ViewId,
} from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import type { IconName } from "../../ui/icon/index.ts";
import { cellValue, matchesGroup } from "./filter-match.ts";
import { propertyType } from "./property-registry.ts";
import {
  selectActiveView,
  selectViewHolder,
  selectViewSource,
} from "./view-holder.selectors.ts";
import { selectRows } from "./row-values.selectors.ts";

// The title column is every row's page title. It behaves as a text
// property with this reserved id.
export const TITLE_PROPERTY_ID = parsePropertyId("title") ?? undefined;
export const DEFAULT_COLUMN_WIDTH = 180;
export const TITLE_COLUMN_WIDTH = 280;

export interface TableRow {
  readonly id: BlockId;
  readonly title: string;
  readonly values: Readonly<Record<string, unknown>>;
}

export interface TableColumn {
  readonly property: PropertyDefinition;
  readonly isTitle: boolean;
  readonly width: number;
  readonly sortDirection: "ascending" | "descending" | undefined;
  // True when the column's text wraps onto more lines.
  readonly isWrapped?: boolean;
  // For a frozen column, the width of the columns before it: where it
  // stays while the table scrolls sideways.
  readonly frozenStart?: number;
}

export interface TableModel {
  // The database, or the linked view, whose views these are.
  readonly holderId: BlockId;
  readonly viewIds: readonly ViewId[];
  readonly database: DatabaseBlock;
  readonly view: View;
  // Visible columns in order; the title column is always first.
  readonly columns: readonly TableColumn[];
  // Rows after the view's filters and sorts.
  readonly rows: readonly TableRow[];
  readonly totalRowCount: number;
  // Today as "YYYY-MM-DD" (empty when unknown), which the model's filters
  // and its rows' colors were worked out against.
  readonly today?: string;
}

const features = tableFeatures({
  coreReactivityFeature: storeReactivityBindings(),
  rowSortingFeature,
  columnFilteringFeature,
  sortedRowModel: createSortedRowModel(),
  filteredRowModel: createFilteredRowModel(),
});

type Features = typeof features;

export function titleProperty(): PropertyDefinition | undefined {
  if (TITLE_PROPERTY_ID === undefined) return undefined;
  return { id: TITLE_PROPERTY_ID, name: "Name", type: "text" };
}

// A property's icon in lists: the title column's "Aa", as its header.
export function propertyIcon(property: PropertyDefinition): IconName {
  if (property.id === TITLE_PROPERTY_ID) return "title";
  return propertyType(property.type).icon;
}

function columnDefs(
  properties: readonly PropertyDefinition[],
): ColumnDef<Features, TableRow>[] {
  return properties.map((property) => ({
    id: property.id,
    accessorFn: (row: TableRow) => cellValue(row, property, TITLE_PROPERTY_ID),
    sortUndefined: "last" as const,
    sortFn: (a, b, columnId) =>
      propertyType(property.type).compare(
        a.getValue(columnId),
        b.getValue(columnId),
      ),
  }));
}

function known(
  properties: readonly PropertyDefinition[],
  id: PropertyId,
): boolean {
  return properties.some((property) => property.id === id);
}

// The engine's sort settings, built from the View record. Filters are
// worked out before, since their groups may join conditions with or.
function engineState(view: View, properties: readonly PropertyDefinition[]) {
  const sorting = view.sorts
    .filter((sort) => known(properties, sort.propertyId))
    .map((sort) => ({
      id: sort.propertyId,
      desc: sort.direction === "descending",
    }));
  return { sorting };
}

interface Query {
  readonly view: View;
  readonly properties: readonly PropertyDefinition[];
  readonly today: string;
  readonly state: AppState;
}

export function sortedAndFiltered(data: TableRow[], query: Query): TableRow[] {
  const { view, properties, today, state } = query;
  const weekStartsOn = view.calendar.weekStartsOn;
  const titleId = TITLE_PROPERTY_ID;
  const context = { properties, titleId, today, weekStartsOn, state };
  const shown = data.filter((row) => matchesGroup(row, view.filter, context));
  const table = constructTable({
    features,
    columns: columnDefs(properties),
    data: shown,
    getRowId: (row) => row.id,
    state: engineState(view, properties),
  });
  return table.getRowModel().rows.map((row) => row.original);
}

// Properties in the order the view shows them: its saved order first, then
// any property added since, with hidden ones left out.
function orderedProperties(
  view: View,
  properties: readonly PropertyDefinition[],
): PropertyDefinition[] {
  const position = (property: PropertyDefinition): number => {
    const index = view.propertyOrder.indexOf(property.id);
    return index === -1
      ? view.propertyOrder.length + properties.indexOf(property)
      : index;
  };
  return properties
    .filter((property) => !view.hiddenPropertyIds.includes(property.id))
    .sort((a, b) => position(a) - position(b));
}

function toColumn(view: View, property: PropertyDefinition): TableColumn {
  const isTitle = property.id === TITLE_PROPERTY_ID;
  const fallback = isTitle ? TITLE_COLUMN_WIDTH : DEFAULT_COLUMN_WIDTH;
  return {
    property,
    isTitle,
    width: view.propertyWidths[property.id] ?? fallback,
    sortDirection: view.sorts.find((sort) => sort.propertyId === property.id)
      ?.direction,
    isWrapped:
      view.table?.wrapAll === true ||
      view.wrappedPropertyIds.includes(property.id),
  };
}

// The first `frozenCount` columns stay in place, each after the ones
// before it.
function freeze(columns: TableColumn[], frozenCount: number): TableColumn[] {
  let start = 0;
  return columns.map((column, index) => {
    if (index >= frozenCount) return column;
    const frozen = { ...column, frozenStart: start };
    start += column.width;
    return frozen;
  });
}

interface Cached {
  readonly blocks: AppState["workspace"]["blocks"];
  readonly view: View;
  readonly today: string;
  readonly model: TableModel;
}

// The last model per database. A model depends only on the workspace's
// blocks, the view and today, so the same inputs give it back.
const cache = new Map<BlockId, Cached>();

// `today` ("YYYY-MM-DD") serves filters such as "within the past week".
export function selectTableModel(
  state: AppState,
  holderId: BlockId,
  today = "",
): TableModel | undefined {
  const holder = selectViewHolder(state, holderId);
  const view =
    holder === undefined ? undefined : selectActiveView(state, holder);
  const title = titleProperty();
  if (holder === undefined || view === undefined || title === undefined)
    return undefined;
  const database = selectViewSource(state, holder.database, view);
  const { blocks } = state.workspace;
  const cached = cache.get(holderId);
  if (
    cached?.blocks === blocks &&
    cached.view === view &&
    cached.today === today
  ) {
    return cached.model;
  }
  const all = [title, ...database.props.properties];
  const data = selectRows({ state, today }, database);
  const others = orderedProperties(view, database.props.properties);
  const model: TableModel = {
    holderId,
    viewIds: holder.viewIds,
    database,
    view,
    columns: freeze(
      [title, ...others].map((property) => toColumn(view, property)),
      view.frozenCount,
    ),
    rows: sortedAndFiltered(data, { view, properties: all, today, state }),
    totalRowCount: data.length,
    today,
  };
  cache.set(holderId, { blocks, view, today, model });
  return model;
}
