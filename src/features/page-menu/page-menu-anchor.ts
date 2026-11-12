// Where a page's menu was opened from: the same page shows its menu button
// in several places, so an anchor id names the place as well as the page.
import { parseBlockId, type BlockId } from "../../model/index.ts";

// The sidebar's rows open the menu from the page tree, which shows a
// shorter menu.
export const TREE_PLACE = "tree";

export function pageMenuAnchorId(place: string, pageId: BlockId): string {
  return `${place}:${pageId}`;
}

export function pageIdOfAnchor(
  anchorId: string | undefined,
): BlockId | undefined {
  return parseBlockId(anchorId?.split(":")[1] ?? "");
}

export function placeOfAnchor(anchorId: string | undefined): string {
  return anchorId?.split(":")[0] ?? "";
}
