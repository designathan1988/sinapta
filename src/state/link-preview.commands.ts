// A web bookmark's preview, as the server read it (ADR-0013): kept on the
// block whose address it is, unless the address changed meanwhile.
import type { BlockId } from "../model/index.ts";
import { defineCommand } from "./command-registry.ts";

export interface LinkPreview {
  readonly title: string;
  readonly description: string;
  readonly image: string | null;
  readonly icon: string | null;
}

export const setLinkPreview = defineCommand<{
  blockId: BlockId;
  url: string;
  preview: LinkPreview;
}>({
  type: "link.setPreview",
  handle(state, { blockId, url, preview }) {
    const block = state.workspace.blocks[blockId];
    if (block?.props.url !== url) return {};
    const props = { ...block.props, preview };
    return {
      operations: [
        { type: "record.update", kind: "block", id: blockId, patch: { props } },
      ],
    };
  },
});

export const linkPreviewCommands = [setLinkPreview];
