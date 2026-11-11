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
import { parseBlockId, type BlockId } from "../../../../model/index.ts";
import type { AppState } from "../../../../state/index.ts";
import { propertyType } from "../../property-registry.ts";
import { selectRowValues } from "../../row-values.selectors.ts";
import { readRelation, readRelationConfig } from "../relation/index.ts";
import {
  applyRollup,
  type RollupCell,
  type RollupResult,
} from "./rollup-math.ts";
import { readRollupConfig, type RollupConfig } from "./rollup.schema.ts";

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

export function selectRollup(
  state: AppState,
  rowId: BlockId,
  property: PropertyDefinition,
): RollupResult | undefined {
  const config = readRollupConfig(property.config);
  const row = selectPage(state, rowId);
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
