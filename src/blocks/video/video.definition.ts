import { isBlockOfType } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { emptyMediaProps } from "../media/index.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import {
  VIDEO_TYPE,
  videoPropsSchema,
  type VideoBlock,
} from "./video.schema.ts";
import { videoCommands, renderVideo } from "./video.view.ts";

export const videoDefinition: BlockDefinition = {
  type: VIDEO_TYPE,
  label: COPY.media.video.name,
  propsSchema: videoPropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: emptyMediaProps,
  commands: videoCommands.commands,
  render: (block, dispatch, state) =>
    isBlockOfType<VideoBlock>(block, VIDEO_TYPE)
      ? renderVideo(block, dispatch, state)
      : undefined,
};
