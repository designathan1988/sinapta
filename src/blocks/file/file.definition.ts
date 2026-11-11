import { isBlockOfType } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { emptyMediaProps } from "../media/index.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import { FILE_TYPE, filePropsSchema, type FileBlock } from "./file.schema.ts";
import { fileCommands, renderFile } from "./file.view.ts";

export const fileDefinition: BlockDefinition = {
  type: FILE_TYPE,
  label: COPY.media.file.name,
  propsSchema: filePropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: emptyMediaProps,
  commands: fileCommands.commands,
  render: (block, dispatch, state) =>
    isBlockOfType<FileBlock>(block, FILE_TYPE)
      ? renderFile(block, dispatch, state)
      : undefined,
};
