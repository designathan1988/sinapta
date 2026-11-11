import type { TypedBlock } from "../../model/index.ts";
import { mediaPropsSchema, type MediaProps } from "../media/index.ts";

export const AUDIO_TYPE = "audio";

// An audio file, played by the browser's own player.
export const audioPropsSchema = mediaPropsSchema;

export type AudioBlock = TypedBlock<typeof AUDIO_TYPE, MediaProps>;
