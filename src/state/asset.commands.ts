// Files kept for blocks. The file itself never enters a command: the
// asset store keeps it and the outcome is reported here, as an asset for
// the block with the address it is shown from, or the reason it could
// not be kept.
import type { AssetError, AssetId, BlockId } from "../model/index.ts";
import { defineCommand } from "./command-registry.ts";

export const attachAsset = defineCommand<{
  blockId: BlockId;
  assetId: AssetId;
  url: string;
}>({
  type: "asset.attach",
  handle(state, command) {
    const { assetId, url } = command;
    const persistence = {
      ...state.persistence,
      assetUrls: { ...state.persistence.assetUrls, [assetId]: url },
      assetError: null,
    };
    const block = state.workspace.blocks[command.blockId];
    if (block === undefined) return { persistence };
    const props = { ...block.props, assetId };
    return {
      operations: [
        {
          type: "record.update",
          kind: "block",
          id: block.id,
          patch: { props },
        },
      ],
      persistence,
    };
  },
});

// The block stays as it was; the reason is shown with it.
export const failAsset = defineCommand<{
  blockId: BlockId;
  error: AssetError;
}>({
  type: "asset.fail",
  handle: (state, command) => ({
    persistence: {
      ...state.persistence,
      assetError: { blockId: command.blockId, error: command.error },
    },
  }),
});

// The addresses of stored assets, once the asset store has them.
export const addAssetUrls = defineCommand<{
  urls: Readonly<Record<string, string>>;
}>({
  type: "asset.addUrls",
  handle: (state, command) => ({
    persistence: {
      ...state.persistence,
      assetUrls: { ...state.persistence.assetUrls, ...command.urls },
    },
  }),
});

export const assetCommands = [attachAsset, failAsset, addAssetUrls];
