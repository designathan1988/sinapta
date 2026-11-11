import type { TypedBlock } from "../../model/index.ts";
import { mediaPropsSchema, type MediaProps } from "../media/index.ts";

export const FILE_TYPE = "file";

// Any file, shown by name and size with a link to download it.
export const filePropsSchema = mediaPropsSchema;

export type FileBlock = TypedBlock<typeof FILE_TYPE, MediaProps>;
