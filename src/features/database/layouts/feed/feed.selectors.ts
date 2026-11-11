// A feed of the view's rows, as Notion's: each row a post with its icon,
// its title and the first blocks of its page, read as plain text.
import { isTextBlock, textOf } from "../../../../blocks/index.ts";
import type { BlockId } from "../../../../model/index.ts";
import type { AppState } from "../../../../state/index.ts";
import type { TableModel, TableRow } from "../../table-model.selectors.ts";

// How many of a page's blocks a post shows.
export const FEED_BLOCKS = 5;

// Text blocks, which say nothing when empty.
const TEXTLESS_SKIPPED = new Set([
  "paragraph",
  "heading",
  "bulleted-list",
  "numbered-list",
  "to-do",
  "toggle",
  "quote",
  "callout",
]);

export interface FeedBlock {
  readonly id: BlockId;
  // The block's type, which the stylesheet draws: a heading's size, a
  // list's mark, a to-do's box.
  readonly type: string;
  readonly level?: number;
  readonly text: string;
  readonly isChecked?: boolean;
}

export interface FeedPost {
  readonly row: TableRow;
  readonly icon: string | null;
  readonly blocks: readonly FeedBlock[];
}

function blockOf(state: AppState, id: BlockId): FeedBlock | undefined {
  const block = state.workspace.blocks[id];
  if (block === undefined) return undefined;
  const { level, checked } = block.props;
  return {
    id,
    type: block.type,
    text: isTextBlock(block) ? textOf(block) : "",
    ...(typeof level === "number" && { level }),
    ...(typeof checked === "boolean" && { isChecked: checked }),
  };
}

export function selectFeed(state: AppState, model: TableModel): FeedPost[] {
  return model.rows.map((row) => {
    const page = state.workspace.blocks[row.id];
    const icon = page?.props.icon;
    // Empty lines say nothing: the post shows the first five that do.
    const blocks = (page?.childIds ?? [])
      .flatMap((id) => blockOf(state, id) ?? [])
      .filter((block) => block.text !== "" || !TEXTLESS_SKIPPED.has(block.type))
      .slice(0, FEED_BLOCKS);
    return { row, icon: typeof icon === "string" ? icon : null, blocks };
  });
}
