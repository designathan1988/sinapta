// A rollup's value for one row, worked out from the rows its relation
// holds. Rollups are derived, never stored (specification 2.1). They read
// what the related rows store, not other rollups, so they cannot loop.
import {
  selectDatabase,
  type DatabaseBlock,
  type PropertyDefinition,
} from "../../../../blocks/database/index.ts";
import {
  selectIsInTrash,
  selectPage,
  selectPageTitle,
  type PageBlock,
} from "../../../../blocks/page/index.ts";
import {
  parseBlockId,
  parsePropertyId,
  type BlockId,
} from "../../../../model/index.ts";
import type { AppState } from "../../../../state/index.ts";
import { propertyType } from "../../property-registry.ts";
import { selectRowValues } from "../../row-values.selectors.ts";
import { readRelation, readRelationConfig } from "../relation/index.ts";
import {
  applyRollup,
  type RollupCell,
  type RollupResult,
} from "./rollup-math.ts";
import { effectiveRollupConfig } from "./rollup-effective.ts";
import type { RollupConfig } from "./rollup.schema.ts";

export const TITLE_TARGET = "title";

interface Related {
  readonly database: DatabaseBlock;
  readonly rows: readonly PageBlock[];
}

// The related database and the rows of it the row relates to that are
// shown: still there and not in the trash.
function selectRelated(
  state: AppState,
  row: PageBlock,
  config: RollupConfig,
): Related | undefined {
  const relation = selectDatabase(state, row.parentId)?.props.properties.find(
    (item) => item.id === config.relationPropertyId,
  );
  const targetId = readRelationConfig(relation?.config)?.databaseId;
  const database = selectDatabase(state, targetId ?? null);
  if (relation === undefined || database === undefined) return undefined;
  const ids = readRelation(row.props.values?.[relation.id]) ?? [];
  const rows = ids.flatMap((id) => {
    const page = selectPage(state, parseBlockId(id) ?? null);
    const isShown =
      page?.parentId === database.id && !selectIsInTrash(state, page);
    return isShown ? [page] : [];
  });
  return { database, rows };
}

function cellOf(page: PageBlock, target: PropertyDefinition): RollupCell {
  const type = propertyType(target.type);
  const value = type.read(selectRowValues(page, [target])[target.id]);
  return { value, text: value === undefined ? "" : type.format(value, target) };
}

function titleCell(page: PageBlock): RollupCell {
  const title = selectPageTitle(page);
  return { value: title === "" ? undefined : title, text: title };
}

// The settings a row's rollup works out from, by its database.
function configFor(
  state: AppState,
  row: PageBlock | undefined,
  property: PropertyDefinition,
): RollupConfig | undefined {
  const holder = selectDatabase(state, row?.parentId ?? null);
  return effectiveRollupConfig(property, holder);
}

export function selectRollup(
  state: AppState,
  rowId: BlockId,
  property: PropertyDefinition,
): RollupResult | undefined {
  const row = selectPage(state, rowId);
  const config = configFor(state, row, property);
  if (config === undefined || row === undefined) return undefined;
  const related = selectRelated(state, row, config);
  if (related === undefined) return undefined;
  if (config.targetPropertyId === TITLE_TARGET) {
    return applyRollup(config.function, related.rows.map(titleCell));
  }
  const target = related.database.props.properties.find(
    (item) => item.id === config.targetPropertyId,
  );
  if (target === undefined) return undefined;
  const cells = related.rows.map((page) => cellOf(page, target));
  return applyRollup(config.function, cells);
}

// What a rollup reads, for its filter: the related database's property
// (or a title column), and per row the value of each related row.
export interface RollupTarget {
  readonly target: PropertyDefinition;
  readonly database: DatabaseBlock;
}

const TITLE_COLUMN = { name: "Name", type: "text" } as const;

function titleTarget(): PropertyDefinition | undefined {
  const id = parsePropertyId(TITLE_TARGET);
  return id === undefined ? undefined : { id, ...TITLE_COLUMN };
}

export function selectRollupTarget(
  state: AppState,
  holderId: BlockId,
  property: PropertyDefinition,
): RollupTarget | undefined {
  const holder = selectDatabase(state, holderId);
  const config = effectiveRollupConfig(property, holder);
  if (config === undefined || holder === undefined) return undefined;
  const relation = holder.props.properties.find(
    (item) => item.id === config.relationPropertyId,
  );
  const targetId = readRelationConfig(relation?.config)?.databaseId;
  const database = selectDatabase(state, targetId ?? null);
  if (database === undefined) return undefined;
  const target =
    config.targetPropertyId === TITLE_TARGET
      ? titleTarget()
      : database.props.properties.find(
          (item) => item.id === config.targetPropertyId,
        );
  return target === undefined ? undefined : { target, database };
}

// The value of each related row, as the target's type reads it.
export function selectRollupValues(
  state: AppState,
  rowId: BlockId,
  property: PropertyDefinition,
): readonly unknown[] | undefined {
  const row = selectPage(state, rowId);
  const config = configFor(state, row, property);
  if (config === undefined || row === undefined) return undefined;
  const related = selectRelated(state, row, config);
  if (related === undefined) return undefined;
  if (config.targetPropertyId === TITLE_TARGET) {
    return related.rows.map((page) => titleCell(page).value);
  }
  const target = related.database.props.properties.find(
    (item) => item.id === config.targetPropertyId,
  );
  if (target === undefined) return undefined;
  return related.rows.map((page) => cellOf(page, target).value);
}
