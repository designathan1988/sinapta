// The picture above a card's title, as the view chooses: the row page's
// cover, or the page's content: its first image, kept file or address
// alike, else its first lines of text, as Notion's miniature of the page.
import { isTextBlock, textOf } from "../../../../blocks/index.ts";
import { IMAGE_TYPE, type ImageBlock } from "../../../../blocks/image/index.ts";
import { COVER_PRESETS } from "../../../../blocks/page/index.ts";
import {
  isBlockOfType,
  type BlockId,
  type View,
} from "../../../../model/index.ts";
import { selectAssetUrl, type AppState } from "../../../../state/index.ts";

export type CardPicture =
  | { readonly src: string }
  // One of the page cover presets, drawn by its style.
  | { readonly preset: string }
  // The page's first lines of text; none for an empty page.
  | { readonly lines: readonly string[] };

// As many lines as the preview's height shows.
const PREVIEW_LINES = 8;

function firstImage(state: AppState, rowId: BlockId): CardPicture | undefined {
  const row = state.workspace.blocks[rowId];
  for (const id of row?.childIds ?? []) {
    const block = state.workspace.blocks[id];
    if (block === undefined || !isBlockOfType<ImageBlock>(block, IMAGE_TYPE))
      continue;
    const { assetId, src } = block.props;
    const kept =
      assetId === undefined ? undefined : selectAssetUrl(state, assetId);
    const address = kept ?? src;
    if (address !== "") return { src: address };
  }
  return undefined;
}

function firstLines(state: AppState, rowId: BlockId): CardPicture {
  const row = state.workspace.blocks[rowId];
  const lines = (row?.childIds ?? []).flatMap((id) => {
    const block = state.workspace.blocks[id];
    if (!isTextBlock(block)) return [];
    const line = textOf(block);
    return line === "" ? [] : [line];
  });
  return { lines: lines.slice(0, PREVIEW_LINES) };
}

function pageCover(state: AppState, rowId: BlockId): CardPicture | undefined {
  const cover = state.workspace.blocks[rowId]?.props.cover;
  if (typeof cover !== "string" || cover === "") return undefined;
  const isPreset = COVER_PRESETS.some((preset) => preset === cover);
  return isPreset ? { preset: cover } : { src: cover };
}

export function selectCardPicture(
  state: AppState,
  rowId: BlockId,
  preview: View["cardPreview"],
): CardPicture | undefined {
  if (preview === "cover") return pageCover(state, rowId);
  if (preview === "content") {
    return firstImage(state, rowId) ?? firstLines(state, rowId);
  }
  return undefined;
}
