import { isBlockOfType } from "../../model/index.ts";
import { selectOverlayAt } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { BlockDefinition } from "../block-definition.ts";
import { PARAGRAPH_TYPE } from "../paragraph/index.ts";
import {
  CALLOUT_TYPE,
  calloutPropsSchema,
  type CalloutBlock,
} from "./callout.schema.ts";
import { calloutCommands } from "./callout.commands.ts";
import { renderCallout } from "./callout.view.ts";

const DEFAULT_ICON = "💡";

export const calloutDefinition: BlockDefinition = {
  type: CALLOUT_TYPE,
  label: COPY.blockNames.callout,
  propsSchema: calloutPropsSchema,
  continuesAs: PARAGRAPH_TYPE,
  createProps: (text) => ({ text, icon: DEFAULT_ICON }),
  commands: calloutCommands,
  // Its icon picker, while open, reads the rest of the state.
  drawnFrom: (block, state) => [
    selectOverlayAt(state, block.id) === null ? null : state,
  ],
  render: (block, dispatch, state) =>
    isBlockOfType<CalloutBlock>(block, CALLOUT_TYPE)
      ? renderCallout(block, dispatch, state)
      : undefined,
};
