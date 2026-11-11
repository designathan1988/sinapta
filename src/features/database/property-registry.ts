// The list of property types. A new property type is one folder under
// properties/ and one line here.
import {
  databasePropsReader,
  type PropertyConfigSchemas,
} from "../../blocks/database/index.ts";
import { DATABASE_TYPE } from "../../blocks/page/index.ts";
import type { PropsSchemas } from "../../model/index.ts";
import type { PropertyType } from "./property-definition.ts";
import { checkboxProperty } from "./properties/checkbox/index.ts";
import { createdTimeProperty } from "./properties/created-time/index.ts";
import { dateProperty } from "./properties/date/index.ts";
import { editedTimeProperty } from "./properties/edited-time/index.ts";
import { emailProperty } from "./properties/email/index.ts";
import { filesProperty } from "./properties/files/index.ts";
import { multiSelectProperty } from "./properties/multi-select/index.ts";
import { numberProperty } from "./properties/number/index.ts";
import { phoneProperty } from "./properties/phone/index.ts";
import { relationProperty } from "./properties/relation/index.ts";
import { rollupProperty } from "./properties/rollup/index.ts";
import { selectProperty } from "./properties/select/index.ts";
import { statusProperty } from "./properties/status/index.ts";
import { textProperty } from "./properties/text/index.ts";
import { uniqueIdProperty } from "./properties/unique-id/index.ts";
import { urlProperty } from "./properties/url/index.ts";

export const PROPERTY_TYPES: readonly PropertyType[] = [
  textProperty,
  numberProperty,
  selectProperty,
  multiSelectProperty,
  statusProperty,
  dateProperty,
  checkboxProperty,
  urlProperty,
  emailProperty,
  phoneProperty,
  filesProperty,
  relationProperty,
  rollupProperty,
  createdTimeProperty,
  editedTimeProperty,
  uniqueIdProperty,
];

const BY_TYPE: ReadonlyMap<string, PropertyType> = new Map(
  PROPERTY_TYPES.map((property) => [property.type, property]),
);

// An unknown type is read as text, so its values are still shown.
export function propertyType(type: string): PropertyType {
  return BY_TYPE.get(type) ?? textProperty;
}

// Property type name to the schema of its config, for the types that have
// one.
export const PROPERTY_CONFIG_SCHEMAS: PropertyConfigSchemas = new Map(
  PROPERTY_TYPES.flatMap((property) =>
    property.configSchema === undefined
      ? []
      : [[property.type, property.configSchema] as const],
  ),
);

// The block props schemas with databases read property by property, so
// that each property's config is checked against its type's schema.
export function withPropertyConfigs(
  schemas: PropsSchemas,
  configSchemas: PropertyConfigSchemas = PROPERTY_CONFIG_SCHEMAS,
): PropsSchemas {
  return new Map([
    ...schemas,
    [DATABASE_TYPE, databasePropsReader(configSchemas)],
  ]);
}
