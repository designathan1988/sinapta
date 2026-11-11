// Changing a property's type, as Notion's "Change type": the property
// takes the new type and every row's value is carried over.
import {
  selectDatabase,
  type DatabaseBlock,
  type PropertyDefinition,
} from "../../blocks/database/index.ts";
import { selectPage } from "../../blocks/page/index.ts";
import type { Operation } from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import { updateProperties } from "./database.commands.ts";
import {
  convertedProperty,
  convertedValue,
  keepsOwnValues,
  optionsNamed,
} from "./property-convert.ts";
import type { TypeChange } from "./property-type.selectors.ts";
import { numberExistingRows } from "./row-numbering.ts";

export interface ChangePropertyTypePayload extends TypeChange {
  // The options the values become, from selectOptionNamesFor.
  readonly optionNames: readonly string[];
}

// Each row's value as the new property holds it. The rows are not marked
// as edited: their content stays what it was.
function convertRows(
  state: AppState,
  database: DatabaseBlock,
  change: { from: PropertyDefinition; to: PropertyDefinition },
): Operation[] {
  if (keepsOwnValues(change.to.type)) return [];
  const { id } = change.from;
  return database.childIds.flatMap((rowId): Operation[] => {
    const row = selectPage(state, rowId);
    if (row === undefined) return [];
    const { [id]: stored, ...others } = row.props.values ?? {};
    if (stored === undefined) return [];
    const value = convertedValue(change.from, change.to, stored);
    const values = value === undefined ? others : { ...others, [id]: value };
    const patch = { props: { ...row.props, values } };
    return [{ type: "record.update", kind: "block", id: rowId, patch }];
  });
}

export const changePropertyType = defineCommand<ChangePropertyTypePayload>({
  type: "property.changeType",
  newIds: (payload) => ({ properties: payload.optionNames.length }),
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    const from = database?.props.properties.find(
      (property) => property.id === command.propertyId,
    );
    if (database === undefined || from === undefined) return {};
    if (from.type === command.propertyType) return {};
    const created = optionsNamed(command.optionNames, command.meta.propertyIds);
    const converted = convertedProperty(from, command.propertyType, created);
    // A unique ID numbers the rows afresh.
    const numbered = numberExistingRows(state, database, converted);
    const to = numbered.property;
    const properties = database.props.properties.map((property) =>
      property.id === to.id ? to : property,
    );
    return {
      operations: [
        ...updateProperties(database, properties),
        ...numbered.operations,
        ...convertRows(state, database, { from, to }),
      ],
    };
  },
});

export const propertyTypeCommands = [changePropertyType];
