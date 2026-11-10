// The list of block types. A new block type is one folder and one line here.
import type { PropsSchemas } from "../model/index.ts";
import type { BlockDefinition } from "./block-definition.ts";
import { bulletedListDefinition } from "./bulleted-list/index.ts";
import { dividerDefinition } from "./divider/index.ts";
import { headingDefinition } from "./heading/index.ts";
import { numberedListDefinition } from "./numbered-list/index.ts";
import { pageDefinition } from "./page/index.ts";
import { paragraphDefinition } from "./paragraph/index.ts";
import { quoteDefinition } from "./quote/index.ts";
import { toDoDefinition } from "./to-do/index.ts";

export const BLOCK_DEFINITIONS: readonly BlockDefinition[] = [
  pageDefinition,
  paragraphDefinition,
  headingDefinition,
  bulletedListDefinition,
  numberedListDefinition,
  toDoDefinition,
  quoteDefinition,
  dividerDefinition,
];

const BY_TYPE: ReadonlyMap<string, BlockDefinition> = new Map(
  BLOCK_DEFINITIONS.map((definition) => [definition.type, definition]),
);

export function blockDefinition(type: string): BlockDefinition | undefined {
  return BY_TYPE.get(type);
}

export const BLOCK_PROPS_SCHEMAS: PropsSchemas = new Map(
  BLOCK_DEFINITIONS.map((definition) => [
    definition.type,
    definition.propsSchema,
  ]),
);
