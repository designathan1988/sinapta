import type { TypedBlock } from "../../model/index.ts";
import { mediaPropsSchema, type MediaProps } from "../media/index.ts";

export const PDF_TYPE = "pdf";

// A PDF: a file kept in the asset store is shown in a frame; one on the web opens in a new tab.
export const pdfPropsSchema = mediaPropsSchema;

export type PdfBlock = TypedBlock<typeof PDF_TYPE, MediaProps>;
