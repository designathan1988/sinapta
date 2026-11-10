import { isBlockOfType, type BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { PAGE_TYPE, type PageBlock } from "./page.schema.ts";

export function selectPage(
  state: AppState,
  pageId: BlockId | null,
): PageBlock | undefined {
  if (pageId === null) return undefined;
  const block = state.workspace.blocks[pageId];
  if (block === undefined) return undefined;
  return isBlockOfType<PageBlock>(block, PAGE_TYPE) ? block : undefined;
}

// The title as plain text; empty for an untitled page.
export function selectPageTitle(page: PageBlock): string {
  return page.props.title.map((span) => span.text).join("");
}
