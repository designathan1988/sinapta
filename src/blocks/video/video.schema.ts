import type { TypedBlock } from "../../model/index.ts";
import { mediaPropsSchema, type MediaProps } from "../media/index.ts";

export const VIDEO_TYPE = "video";

// A video, played by the browser's own player.
export const videoPropsSchema = mediaPropsSchema;

export type VideoBlock = TypedBlock<typeof VIDEO_TYPE, MediaProps>;
