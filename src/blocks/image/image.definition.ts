import { isBlockOfType } from "../../model/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import { imageCommands } from "./image.commands.ts";
import {
  IMAGE_TYPE,
  imagePropsSchema,
  type ImageBlock,
} from "./image.schema.ts";
import { renderImage } from "./image.view.ts";

// An image from a web address or a file; any text it is made from is
// dropped, since an image holds none.
export const imageDefinition: BlockDefinition = {
  type: IMAGE_TYPE,
  label: COPY.blockNames.image,
  propsSchema: imagePropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: () => ({ src: "", caption: "" }),
  commands: imageCommands,
  render: (block, dispatch, state) =>
    isBlockOfType<ImageBlock>(block, IMAGE_TYPE)
      ? renderImage(block, dispatch, state)
      : undefined,
};
