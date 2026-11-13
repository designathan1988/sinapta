// What a property type tells views about grouping rows by its values:
// which groups a value falls in, which groups the property defines by
// itself, and what value a row takes when it moves into a group.
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { GroupBy } from "../../model/index.ts";

export type DateStep = GroupBy["dateBy"];

export interface GroupKey {
  // Unique among the property's groups; "" is the group of empty values.
  readonly key: string;
  readonly label: string;
  // An option color, shown as a chip.
  readonly color?: string;
  // What groups are put in order by when not by label, such as a date.
  readonly sortValue?: string;
}

export interface Grouping {
  // The groups a value that `read` returned falls in; more than one for
  // a value that holds several options.
  // The view's grouping says how, such as a date's span or text by its
  // first letter; absent, each type's default.
  readonly keysOf: (
    value: unknown,
    property: PropertyDefinition,
    groupBy?: GroupBy,
  ) => readonly GroupKey[];
  // The groups shown even without rows, in the property's own order.
  readonly known?: (property: PropertyDefinition) => readonly GroupKey[];
  // True when rows with no value have a group even while it is empty,
  // such as the board column a card goes to when its option is removed.
  readonly keepsEmptyGroup?: boolean;
  // True when the group of empty values comes after the others, as
  // Notion lists a text property's "No <name>".
  readonly isEmptyLast?: boolean;
  // The value a row takes when it moves into a group; absent when rows
  // cannot move between this type's groups.
  readonly valueFor?: (key: string) => unknown;
}

export const EMPTY_GROUP_KEY = "";
