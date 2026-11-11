// The commands of a media block type, named after it: "video.setUrl" and
// "video.setCaption" for videos, and so on.
import { safeWebAddress, type BlockId } from "../../model/index.ts";
import {
  defineCommand,
  type AppState,
  type CommandEffect,
} from "../../state/index.ts";

interface Target {
  readonly blockId: BlockId;
  readonly type: string;
  readonly now: string;
}

function patchProps(
  state: AppState,
  target: Target,
  props: Record<string, unknown>,
): CommandEffect {
  const block = state.workspace.blocks[target.blockId];
  if (block?.type !== target.type) return {};
  const patch = { props: { ...block.props, ...props }, updatedAt: target.now };
  return {
    operations: [{ type: "record.update", kind: "block", id: block.id, patch }],
  };
}

export function defineMediaCommands(type: string) {
  // Only a secure web address is taken; anything else changes nothing.
  const setUrl = defineCommand<{ blockId: BlockId; url: string }>({
    type: `${type}.setUrl`,
    handle(state, command) {
      const url = safeWebAddress(command.url);
      if (url === undefined) return {};
      const target = { blockId: command.blockId, type, now: command.meta.now };
      return patchProps(state, target, { url });
    },
  });
  const setCaption = defineCommand<{ blockId: BlockId; caption: string }>({
    type: `${type}.setCaption`,
    handle(state, command) {
      const caption = command.caption.normalize("NFC");
      const target = { blockId: command.blockId, type, now: command.meta.now };
      return patchProps(state, target, { caption });
    },
  });
  return { setUrl, setCaption, commands: [setUrl, setCaption] };
}

export type MediaCommands = ReturnType<typeof defineMediaCommands>;
