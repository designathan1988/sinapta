// A rollup's filter conditions, as Notion's: the conditions of the
// property it reads, each asked of Any, None or Every related value
// ("every:is" keeps a row when every related value is the operand). A
// rollup with no relation yet offers none. Conditions saved on the
// rollup's written text before stay readable, never offered.
import {
  selectDatabase,
  type PropertyDefinition,
} from "../../../../blocks/database/index.ts";
import { parseBlockId, type BlockId } from "../../../../model/index.ts";
import type { AppState } from "../../../../state/index.ts";
import {
  quantifiedId,
  QUANTIFIERS,
  type Quantifier,
} from "../../filter-quantifier.ts";
import type {
  FilterContext,
  FilterOperator,
} from "../../property-definition.ts";
import { propertyType } from "../../property-registry.ts";
import { selectRollupTarget, selectRollupValues } from "./rollup.selectors.ts";

// The database holding each property, worked out once per workspace.
const holders = new WeakMap<object, Map<string, string>>();

function holdersIn(state: AppState): Map<string, string> {
  const found = new Map<string, string>();
  for (const id of Object.keys(state.workspace.blocks)) {
    const database = selectDatabase(state, parseBlockId(id) ?? null);
    if (database === undefined) continue;
    for (const item of database.props.properties) found.set(item.id, id);
  }
  return found;
}

function holderOf(state: AppState, propertyId: string): BlockId | undefined {
  const { blocks } = state.workspace;
  const found = holders.get(blocks) ?? holdersIn(state);
  holders.set(blocks, found);
  return parseBlockId(found.get(propertyId) ?? "") ?? undefined;
}

// As Notion's (n68-rollup-filters): a row with no related value passes
// None and fails Every.
function asks(quantifier: Quantifier, results: readonly boolean[]): boolean {
  if (quantifier === "any") return results.some(Boolean);
  if (quantifier === "none") return !results.some(Boolean);
  return results.length > 0 && results.every(Boolean);
}

interface Built {
  readonly rollup: PropertyDefinition;
  readonly target: PropertyDefinition;
}

function quantified(
  built: Built,
  quantifier: Quantifier,
  base: FilterOperator,
): FilterOperator {
  const { rollup, target } = built;
  const options = target.options?.map((option) => ({
    id: option.id,
    label: option.name,
  }));
  const choices =
    base.choices ?? (options === undefined ? undefined : () => options);
  return {
    ...base,
    id: quantifiedId(quantifier, base.id) ?? base.id,
    ...(choices !== undefined && { choices: () => choices(target) }),
    test(_value, operand, context?: FilterContext) {
      const { state, rowId } = context ?? {};
      if (state === undefined || rowId === undefined) return false;
      const values = selectRollupValues(state, rowId, rollup) ?? [];
      const inner = { ...context, property: target };
      return asks(
        quantifier,
        values.map((item) => base.test(item, operand, inner)),
      );
    },
  };
}

export function rollupFilterOperators(
  rollup: PropertyDefinition,
  retired: readonly FilterOperator[],
  state?: AppState,
): readonly FilterOperator[] {
  const kept = retired.map((item) => ({ ...item, isRetired: true }));
  const holderId = state === undefined ? undefined : holderOf(state, rollup.id);
  const found =
    state === undefined || holderId === undefined
      ? undefined
      : selectRollupTarget(state, holderId, rollup);
  if (found === undefined) return kept;
  const { target } = found;
  const type = propertyType(target.type);
  const bases = type.filterOperators.filter((item) => item.isRetired !== true);
  const built = { rollup, target };
  const all = QUANTIFIERS.flatMap((quantifier) =>
    bases.map((base) => quantified(built, quantifier, base)),
  );
  return [...all, ...kept];
}
