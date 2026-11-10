// The list of property types. A new property type is one folder under
// properties/ and one line here.
import type { PropertyType } from "./property-definition.ts";
import { checkboxProperty } from "./properties/checkbox/index.ts";
import { dateProperty } from "./properties/date/index.ts";
import { multiSelectProperty } from "./properties/multi-select/index.ts";
import { numberProperty } from "./properties/number/index.ts";
import { selectProperty } from "./properties/select/index.ts";
import { textProperty } from "./properties/text/index.ts";
import { urlProperty } from "./properties/url/index.ts";

export const PROPERTY_TYPES: readonly PropertyType[] = [
  textProperty,
  numberProperty,
  selectProperty,
  multiSelectProperty,
  dateProperty,
  checkboxProperty,
  urlProperty,
];

const BY_TYPE: ReadonlyMap<string, PropertyType> = new Map(
  PROPERTY_TYPES.map((property) => [property.type, property]),
);

// An unknown type is read as text, so its values are still shown.
export function propertyType(type: string): PropertyType {
  return BY_TYPE.get(type) ?? textProperty;
}
