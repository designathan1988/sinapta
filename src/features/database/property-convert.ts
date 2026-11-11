// How a property's values carry over when its type changes, as in
// Notion: options stay between select, multi-select and status; text
// becomes options, one per different text; options become their names;
// any other value goes through its text, which the new type reads.
import type {
  PropertyDefinition,
  SelectOption,
} from "../../blocks/database/index.ts";
import { propertyType } from "./property-registry.ts";
import { OPTION_COLORS } from "./table.commands.ts";

function hasOptions(type: string): boolean {
  return propertyType(type).editor === "options";
}

function isMulti(type: string): boolean {
  return type === "multi-select";
}

// Values the app keeps or works out are not converted: a computed
// property has none stored, and its new values come from its type.
export function keepsOwnValues(type: string): boolean {
  const kind = propertyType(type);
  return (
    kind.editor === "none" ||
    kind.computedFrom !== undefined ||
    kind.compute !== undefined
  );
}

// The value as text, as the old type shows it.
function textOf(property: PropertyDefinition, stored: unknown): string {
  if (keepsOwnValues(property.type)) return "";
  const kind = propertyType(property.type);
  return kind.format(kind.read(stored), property);
}

// The names a value stands for: a multi-select's text holds several.
function namesIn(text: string, type: string): string[] {
  const names = isMulti(type) ? text.split(",") : [text];
  return names.map((name) => name.trim()).filter((name) => name !== "");
}

// The options a property needs as the new type: none when it keeps its
// own, or the different texts of its values, in the order rows hold them.
export function optionNamesOf(
  property: PropertyDefinition,
  type: string,
  stored: readonly unknown[],
): string[] {
  if (!hasOptions(type) || hasOptions(property.type)) return [];
  const names = stored.flatMap((value) =>
    namesIn(textOf(property, value), type),
  );
  return [...new Set(names)];
}

// The property as the new type: its options when both have options, or
// the new ones; a config of the old type does not carry over.
export function convertedProperty(
  property: PropertyDefinition,
  type: string,
  created: readonly SelectOption[],
): PropertyDefinition {
  const { options, config: _config, ...rest } = property;
  if (!hasOptions(type)) return { ...rest, type };
  const kept = hasOptions(property.type) ? (options ?? []) : created;
  return { ...rest, type, options: [...kept] };
}

// New options for the given names, colored in turn.
export function optionsNamed(
  names: readonly string[],
  ids: readonly string[],
): SelectOption[] {
  return names.flatMap((name, index) => {
    const id = ids[index];
    const color = OPTION_COLORS[index % OPTION_COLORS.length] ?? "gray";
    return id === undefined ? [] : [{ id, name, color }];
  });
}

function optionIds(stored: unknown): string[] {
  if (typeof stored === "string" && stored !== "") return [stored];
  return Array.isArray(stored)
    ? stored.filter((id): id is string => typeof id === "string")
    : [];
}

// A value as the new property holds it; undefined clears the cell.
export function convertedValue(
  from: PropertyDefinition,
  to: PropertyDefinition,
  stored: unknown,
): unknown {
  if (hasOptions(to.type)) {
    const ids = hasOptions(from.type)
      ? optionIds(stored)
      : namesIn(textOf(from, stored), to.type).flatMap(
          (name) =>
            to.options?.find((option) => option.name === name)?.id ?? [],
        );
    if (ids.length === 0) return undefined;
    return isMulti(to.type) ? ids : ids[0];
  }
  return propertyType(to.type).parse(textOf(from, stored));
}
