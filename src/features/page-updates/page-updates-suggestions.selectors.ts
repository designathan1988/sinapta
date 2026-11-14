// The page's open suggested edits, as Notion's Updates lists them among
// the edits: who suggested, when, and what ("Add: …", "Delete: …").
import type { PageBlock } from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";

export interface SuggestionEntry {
  readonly id: BlockId;
  readonly at: string;
  readonly author: string | undefined;
  readonly kind: "insert" | "delete";
  readonly text: string;
}

export function selectSuggestionEntries(page: PageBlock): SuggestionEntry[] {
  return (page.props.discussions ?? []).flatMap((discussion) => {
    const { suggestion, isResolved, comments } = discussion;
    if (suggestion === undefined || isResolved) return [];
    const at = discussion.suggestedAt ?? comments[0]?.createdAt ?? "";
    return [
      {
        id: discussion.id,
        at,
        author: comments[0]?.author?.name,
        kind: suggestion,
        text: discussion.quote ?? "",
      },
    ];
  });
}
