// The list of block types. A new block type is one folder and one line here.
import type { PropsSchemas } from "../model/index.ts";
import type { CommandDefinition, Tidier } from "../state/index.ts";
import type { BlockDefinition } from "./block-definition.ts";
import { audioDefinition } from "./audio/index.ts";
import { bookmarkDefinition } from "./bookmark/index.ts";
import { buttonDefinition } from "./button/index.ts";
import { linkedViewDefinition } from "./linked-view/index.ts";
import { breadcrumbDefinition } from "./breadcrumb/index.ts";
import { bulletedListDefinition } from "./bulleted-list/index.ts";
import { calloutDefinition } from "./callout/index.ts";
import { codeDefinition } from "./code/index.ts";
import { columnListDefinition } from "./column-list/index.ts";
import { columnDefinition } from "./column/index.ts";
import { databaseDefinition } from "./database/index.ts";
import { dividerDefinition } from "./divider/index.ts";
import { embedDefinition } from "./embed/index.ts";
import { equationDefinition } from "./equation/index.ts";
import { fileDefinition } from "./file/index.ts";
import { headingDefinition } from "./heading/index.ts";
import { imageDefinition } from "./image/index.ts";
import { numberedListDefinition } from "./numbered-list/index.ts";
import { pageLinkDefinition } from "./page-link/index.ts";
import { pageDefinition } from "./page/index.ts";
import { paragraphDefinition } from "./paragraph/index.ts";
import { pdfDefinition } from "./pdf/index.ts";
import { quoteDefinition } from "./quote/index.ts";
import { simpleTableDefinition } from "./simple-table/index.ts";
import { syncedBlockDefinition } from "./synced-block/index.ts";
import { tableOfContentsDefinition } from "./table-of-contents/index.ts";
import { teamspaceDefinition } from "./teamspace/index.ts";
import { toDoDefinition } from "./to-do/index.ts";
import { toggleDefinition } from "./toggle/index.ts";
import { videoDefinition } from "./video/index.ts";

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
  videoDefinition,
  audioDefinition,
  fileDefinition,
  pdfDefinition,
  bookmarkDefinition,
  embedDefinition,
  simpleTableDefinition,
  tableOfContentsDefinition,
  equationDefinition,
  breadcrumbDefinition,
  columnListDefinition,
  columnDefinition,
  syncedBlockDefinition,
  buttonDefinition,
  linkedViewDefinition,
  teamspaceDefinition,
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

// The rules that keep blocks tidy after every command, in one list.
export const BLOCK_TIDIERS: readonly Tidier[] = BLOCK_DEFINITIONS.flatMap(
  (definition) => (definition.tidy === undefined ? [] : [definition.tidy]),
);
