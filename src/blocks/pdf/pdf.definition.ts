import { isBlockOfType } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { emptyMediaProps } from "../media/index.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import { PDF_TYPE, pdfPropsSchema, type PdfBlock } from "./pdf.schema.ts";
import { pdfCommands, renderPdf } from "./pdf.view.ts";

export const pdfDefinition: BlockDefinition = {
  type: PDF_TYPE,
  label: COPY.media.pdf.name,
  propsSchema: pdfPropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: emptyMediaProps,
  commands: pdfCommands.commands,
  render: (block, dispatch, state) =>
    isBlockOfType<PdfBlock>(block, PDF_TYPE)
      ? renderPdf(block, dispatch, state)
      : undefined,
};
