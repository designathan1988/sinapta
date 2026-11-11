// Relations between rows of two databases (design D8). A two-way relation
// has an inverse property on the other database, a real property of its
// own; setting a value updates both sides in the same transaction.
import {
  selectDatabase,
  type DatabaseBlock,
  type PropertyDefinition,
} from "../../../../blocks/database/index.ts";
import { selectPage, selectPageTitle } from "../../../../blocks/page/index.ts";
import {
  parseBlockId,
  type BlockId,
  type Operation,
  type PropertyId,
} from "../../../../model/index.ts";
import { defineCommand, type AppState } from "../../../../state/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { readRelation, setValueOperation } from "./relation-values.ts";
import { readRelationConfig, type RelationConfig } from "./relation.schema.ts";

export const RELATION_TYPE = "relation";

function withProperties(
  database: DatabaseBlock,
  properties: readonly PropertyDefinition[],
): Operation {
  const props = { ...database.props, properties: [...properties] };
  return {
    type: "record.update",
    kind: "block",
    id: database.id,
    patch: { props },
  };
}

// The values of the property cleared from every row of its database.
function clearedValues(
  state: AppState,
  database: DatabaseBlock,
  propertyId: string,
): Operation[] {
  return database.childIds.flatMap((rowId) => {
    const row = selectPage(state, rowId);
    const value = row?.props.values?.[propertyId];
    if (row === undefined || value === undefined) return [];
    return [setValueOperation(row, propertyId, undefined)];
  });
}

// The other database without the inverse property of an old two-way
// relation.
function withoutInverse(
  state: AppState,
  config: RelationConfig | undefined,
): Operation[] {
  const target = selectDatabase(state, config?.databaseId ?? null);
  const inverseId = config?.inversePropertyId;
  if (target === undefined || inverseId === undefined) return [];
  const properties = target.props.properties.filter(
    (property) => property.id !== inverseId,
  );
  return [withProperties(target, properties)];
}

interface TargetChoice {
  readonly database: DatabaseBlock;
  readonly property: PropertyDefinition;
  readonly target: DatabaseBlock;
  readonly isTwoWay: boolean;
  readonly newId: PropertyId | undefined;
}

// The inverse property made on the other database for a two-way relation.
function inverseOf(choice: TargetChoice): PropertyDefinition | undefined {
  const { database, property, newId } = choice;
  if (!choice.isTwoWay || newId === undefined) return undefined;
  const title = selectPageTitle(database);
  const shown = title === "" ? COPY.database.untitled : title;
  return {
    id: newId,
    name: `${COPY.database.relatedTo} ${shown}`,
    type: RELATION_TYPE,
    config: {
      databaseId: database.id,
      isTwoWay: true,
      inversePropertyId: property.id,
    },
  };
}

function targetOperations(state: AppState, choice: TargetChoice): Operation[] {
  const { database, property, target } = choice;
  const old = readRelationConfig(property.config);
  const inverse = inverseOf(choice);
  const config: RelationConfig = {
    databaseId: target.id,
    isTwoWay: inverse !== undefined,
    ...(inverse !== undefined && { inversePropertyId: inverse.id }),
  };
  const properties = database.props.properties.map((item) =>
    item.id === property.id ? { ...item, config } : item,
  );
  const removed = withoutInverse(state, old);
  // The other database as it is once the old inverse, if any, is gone.
  const fresh = selectDatabase(state, target.id);
  const others = (fresh?.props.properties ?? []).filter(
    (item) => item.id !== old?.inversePropertyId,
  );
  const added =
    inverse === undefined || fresh === undefined
      ? []
      : [withProperties(fresh, [...others, inverse])];
  return [
    withProperties(database, properties),
    ...removed,
    ...added,
    ...clearedValues(state, database, property.id),
  ];
}

// Chooses the database a relation's values come from, and whether it is
// two-way. A relation to its own database is one-way.
export const setRelationTarget = defineCommand<{
  databaseId: BlockId;
  propertyId: PropertyId;
  targetId: BlockId;
  isTwoWay: boolean;
}>({
  type: "relation.setTarget",
  newIds: { properties: 1 },
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    const target = selectDatabase(state, command.targetId);
    const property = database?.props.properties.find(
      (item) => item.id === command.propertyId && item.type === RELATION_TYPE,
    );
    if (database === undefined || target === undefined) return {};
    if (property === undefined) return {};
    const isTwoWay = command.isTwoWay && target.id !== database.id;
    const old = readRelationConfig(property.config);
    if (old?.databaseId === target.id && old.isTwoWay === isTwoWay) return {};
    const newId = command.meta.propertyIds[0];
    const choice = { database, property, target, isTwoWay, newId };
    return { operations: targetOperations(state, choice) };
  },
});

interface Side {
  readonly rowId: BlockId;
  readonly config: RelationConfig;
}

// The other side's rows with this row added or removed.
function inverseOperations(
  state: AppState,
  side: Side,
  change: { added: readonly string[]; removed: readonly string[] },
): Operation[] {
  const inverseId = side.config.inversePropertyId;
  if (!side.config.isTwoWay || inverseId === undefined) return [];
  const update = (id: string, adds: boolean): Operation[] => {
    const row = selectPage(state, parseBlockId(id) ?? null);
    if (row === undefined) return [];
    const held = readRelation(row.props.values?.[inverseId]) ?? [];
    const next = adds
      ? [...new Set([...held, side.rowId])]
      : held.filter((each) => each !== side.rowId);
    return [setValueOperation(row, inverseId, next)];
  };
  return [
    ...change.added.flatMap((id) => update(id, true)),
    ...change.removed.flatMap((id) => update(id, false)),
  ];
}

// Sets the pages a row relates to: rows of the related database only.
export const setRelationValue = defineCommand<{
  rowId: BlockId;
  propertyId: PropertyId;
  value: readonly BlockId[];
}>({
  type: "relation.setValue",
  handle(state, command) {
    const row = selectPage(state, command.rowId);
    const database = selectDatabase(state, row?.parentId ?? null);
    const property = database?.props.properties.find(
      (item) => item.id === command.propertyId,
    );
    const config = readRelationConfig(property?.config);
    if (row === undefined || config === undefined) return {};
    const allowed = command.value.filter(
      (id) => selectPage(state, id)?.parentId === config.databaseId,
    );
    const next = [...new Set(allowed)];
    const old = readRelation(row.props.values?.[command.propertyId]) ?? [];
    const change = {
      added: next.filter((id) => !old.includes(id)),
      removed: old.filter((id) => !next.some((each) => each === id)),
    };
    return {
      operations: [
        setValueOperation(row, command.propertyId, next),
        ...inverseOperations(state, { rowId: row.id, config }, change),
      ],
    };
  },
});

export const relationCommands = [setRelationTarget, setRelationValue];
