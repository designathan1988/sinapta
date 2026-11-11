import { isBlockOfType } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import { CODE_TYPE, codePropsSchema, type CodeBlock } from "./code.schema.ts";
import { codeCommands } from "./code.commands.ts";
import { renderCode } from "./code.view.ts";

export const codeDefinition: BlockDefinition = {
  type: CODE_TYPE,
  label: COPY.blockNames.code,
  propsSchema: codePropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  isMultiline: true,
  createProps: (text) => ({ text }),
  commands: codeCommands,
  render: (block, dispatch) =>
    isBlockOfType<CodeBlock>(block, CODE_TYPE)
      ? renderCode(block, dispatch)
      : undefined,
};
