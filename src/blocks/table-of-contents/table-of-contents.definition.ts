import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import {
  TABLE_OF_CONTENTS_TYPE,
  tableOfContentsPropsSchema,
} from "./table-of-contents.schema.ts";
import { renderTableOfContents } from "./table-of-contents.view.ts";

export const tableOfContentsDefinition: BlockDefinition = {
  type: TABLE_OF_CONTENTS_TYPE,
  label: COPY.blockNames.tableOfContents,
  propsSchema: tableOfContentsPropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: () => ({}),
  render: (block, dispatch, state) =>
    block.type === TABLE_OF_CONTENTS_TYPE
      ? renderTableOfContents(block.id, state, dispatch)
      : undefined,
};
