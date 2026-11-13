// The settings a rollup works out from: those stored, or, where none is
// chosen yet, what its settings show, as Notion's: the database's first
// relation, the related pages' titles, shown as they are.
import type {
  DatabaseBlock,
  PropertyDefinition,
} from "../../../../blocks/database/index.ts";
import { readRollupConfig, type RollupConfig } from "./rollup.schema.ts";

export function effectiveRollupConfig(
  property: PropertyDefinition,
  holder: DatabaseBlock | undefined,
): RollupConfig | undefined {
  const relations = (holder?.props.properties ?? []).filter(
    (item) => item.type === "relation",
  );
  const stored = readRollupConfig(property.config);
  const isKnown = relations.some(
    (item) => item.id === stored?.relationPropertyId,
  );
  const relationPropertyId = isKnown
    ? stored?.relationPropertyId
    : relations[0]?.id;
  if (relationPropertyId === undefined) return undefined;
  return {
    targetPropertyId: "title",
    function: "show-original",
    ...stored,
    relationPropertyId,
  };
}
