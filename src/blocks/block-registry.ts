// The list of block types. A new block type is one folder and one line here.
import type { PropsSchemas } from "../model/index.ts";
import type { CommandDefinition } from "../state/index.ts";
import type { BlockDefinition } from "./block-definition.ts";
import { bookmarkDefinition } from "./bookmark/index.ts";
import { bulletedListDefinition } from "./bulleted-list/index.ts";
import { calloutDefinition } from "./callout/index.ts";
import { codeDefinition } from "./code/index.ts";
import { databaseDefinition } from "./database/index.ts";
import { dividerDefinition } from "./divider/index.ts";
import { headingDefinition } from "./heading/index.ts";
import { imageDefinition } from "./image/index.ts";
import { numberedListDefinition } from "./numbered-list/index.ts";
import { pageLinkDefinition } from "./page-link/index.ts";
import { pageDefinition } from "./page/index.ts";
import { paragraphDefinition } from "./paragraph/index.ts";
import { quoteDefinition } from "./quote/index.ts";
import { simpleTableDefinition } from "./simple-table/index.ts";
import { tableOfContentsDefinition } from "./table-of-contents/index.ts";
import { toDoDefinition } from "./to-do/index.ts";
import { toggleDefinition } from "./toggle/index.ts";

export const BLOCK_DEFINITIONS: readonly BlockDefinition[] = [
  pageDefinition,
  databaseDefinition,
  paragraphDefinition,
  headingDefinition,
  bulletedListDefinition,
  numberedListDefinition,
  toDoDefinition,
  toggleDefinition,
  quoteDefinition,
  calloutDefinition,
  codeDefinition,
  dividerDefinition,
  pageLinkDefinition,
  imageDefinition,
  bookmarkDefinition,
  simpleTableDefinition,
  tableOfContentsDefinition,
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

// The commands every block type declares, registered once at startup.
export const BLOCK_COMMANDS: readonly CommandDefinition<never>[] =
  BLOCK_DEFINITIONS.flatMap((definition) => definition.commands ?? []);
