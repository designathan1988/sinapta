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
import {
  selectDatabase,
  type DatabaseBlock,
  type PropertyDefinition,
} from "../../blocks/database/index.ts";
import { selectPage, selectPageTitle } from "../../blocks/page/index.ts";
import {
  parsePropertyId,
  type BlockId,
  type Filter,
  type PropertyId,
  type View,
} from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { propertyType } from "./property-registry.ts";

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
}

export interface TableModel {
  readonly database: DatabaseBlock;
  readonly view: View;
  // Visible columns in order; the title column is always first.
  readonly columns: readonly TableColumn[];
  // Rows after the view's filters and sorts.
  readonly rows: readonly TableRow[];
  readonly totalRowCount: number;
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

function valueOf(row: TableRow, property: PropertyDefinition): unknown {
  const stored =
    property.id === TITLE_PROPERTY_ID ? row.title : row.values[property.id];
  return propertyType(property.type).read(stored);
}

// Every filter on one property must pass.
function passes(
  value: unknown,
  property: PropertyDefinition,
  filters: readonly Filter[],
): boolean {
  const { filterOperators } = propertyType(property.type);
  return filters.every((filter) => {
    const operator = filterOperators.find(
      (item) => item.id === filter.operator,
    );
    const operand = typeof filter.value === "string" ? filter.value : "";
    return operator === undefined || operator.test(value, operand);
  });
}

function isFilterList(value: unknown): value is readonly Filter[] {
  return Array.isArray(value);
}

function columnDefs(
  properties: readonly PropertyDefinition[],
): ColumnDef<Features, TableRow>[] {
  return properties.map((property) => ({
    id: property.id,
    accessorFn: (row: TableRow) => valueOf(row, property),
    sortUndefined: "last" as const,
    sortFn: (a, b, columnId) =>
      propertyType(property.type).compare(
        a.getValue(columnId),
        b.getValue(columnId),
      ),
    filterFn: (row, columnId, filterValue: unknown) =>
      !isFilterList(filterValue) ||
      passes(row.getValue(columnId), property, filterValue),
  }));
}

function selectRows(state: AppState, database: DatabaseBlock): TableRow[] {
  return database.childIds.flatMap((id) => {
    const page = selectPage(state, id);
    if (page === undefined || page.props.isTrashed) return [];
    return [
      { id, title: selectPageTitle(page), values: page.props.values ?? {} },
    ];
  });
}

function known(
  properties: readonly PropertyDefinition[],
  id: PropertyId,
): boolean {
  return properties.some((property) => property.id === id);
}

// The engine's sort and filter settings, built from the View record.
function engineState(view: View, properties: readonly PropertyDefinition[]) {
  const sorting = view.sorts
    .filter((sort) => known(properties, sort.propertyId))
    .map((sort) => ({
      id: sort.propertyId,
      desc: sort.direction === "descending",
    }));
  const filtered = properties
    .map((property) => ({
      id: property.id,
      value: view.filters.filter((filter) => filter.propertyId === property.id),
    }))
    .filter((entry) => entry.value.length > 0);
  return { sorting, columnFilters: filtered };
}

function sortedAndFiltered(
  data: TableRow[],
  view: View,
  properties: readonly PropertyDefinition[],
): TableRow[] {
  const table = constructTable({
    features,
    columns: columnDefs(properties),
    data,
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
  };
}

// The view of a database that is shown: the one chosen, or its first.
export function selectActiveView(
  state: AppState,
  database: DatabaseBlock,
): View | undefined {
  const chosen = state.ui.activeViewIds[database.id];
  const viewId =
    chosen !== undefined && database.props.viewIds.includes(chosen)
      ? chosen
      : database.props.viewIds[0];
  return viewId === undefined ? undefined : state.workspace.views[viewId];
}

interface Cached {
  readonly blocks: AppState["workspace"]["blocks"];
  readonly view: View;
  readonly model: TableModel;
}

// The last model per database. A model depends only on the workspace's
// blocks and the view, so the same inputs give the same model back.
const cache = new Map<BlockId, Cached>();

export function selectTableModel(
  state: AppState,
  databaseId: BlockId,
): TableModel | undefined {
  const database = selectDatabase(state, databaseId);
  const view =
    database === undefined ? undefined : selectActiveView(state, database);
  const title = titleProperty();
  if (database === undefined || view === undefined || title === undefined)
    return undefined;
  const { blocks } = state.workspace;
  const cached = cache.get(databaseId);
  if (cached?.blocks === blocks && cached.view === view) return cached.model;
  const all = [title, ...database.props.properties];
  const data = selectRows(state, database);
  const others = orderedProperties(view, database.props.properties);
  const model: TableModel = {
    database,
    view,
    columns: [title, ...others].map((property) => toColumn(view, property)),
    rows: sortedAndFiltered(data, view, all),
    totalRowCount: data.length,
  };
  cache.set(databaseId, { blocks, view, model });
  return model;
}
