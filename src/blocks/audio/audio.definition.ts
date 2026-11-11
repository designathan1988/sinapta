import { isBlockOfType } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { emptyMediaProps } from "../media/index.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import {
  AUDIO_TYPE,
  audioPropsSchema,
  type AudioBlock,
} from "./audio.schema.ts";
import { audioCommands, renderAudio } from "./audio.view.ts";

export const audioDefinition: BlockDefinition = {
  type: AUDIO_TYPE,
  label: COPY.media.audio.name,
  propsSchema: audioPropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: emptyMediaProps,
  commands: audioCommands.commands,
  render: (block, dispatch, state) =>
    isBlockOfType<AudioBlock>(block, AUDIO_TYPE)
      ? renderAudio(block, dispatch, state)
      : undefined,
};
