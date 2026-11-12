import { isBlockOfType } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import { embedCommands } from "./embed.commands.ts";
import {
  EMBED_TYPE,
  embedPropsSchema,
  type EmbedBlock,
} from "./embed.schema.ts";
import { renderEmbed } from "./embed.view.ts";

export const embedDefinition: BlockDefinition = {
  type: EMBED_TYPE,
  label: COPY.embed.name,
  propsSchema: embedPropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: () => ({ url: "" }),
  commands: embedCommands,
  drawnFrom: () => [],
  render: (block, dispatch) =>
    isBlockOfType<EmbedBlock>(block, EMBED_TYPE)
      ? renderEmbed(block, dispatch)
      : undefined,
};
