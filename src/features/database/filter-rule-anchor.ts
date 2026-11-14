// Notion's simple filter: rules joined by and, without groups. Each rule
// has a pill under the toolbar, and each pill opens its own rule: the
// overlay's anchor names the database and the rule's place.
import type { FilterGroup } from "../../model/index.ts";
import { isFilterGroup } from "./filter-match.ts";

export const VIEW_FILTER_RULE_OVERLAY = "view-filter-rule";

export function ruleAnchorId(holderId: string, index: number): string {
  return `${holderId}#${String(index)}`;
}

export function ruleIndexOf(
  anchorId: string | undefined,
  holderId: string,
): number | undefined {
  const prefix = `${holderId}#`;
  if (anchorId?.startsWith(prefix) !== true) return undefined;
  const index = Number(anchorId.slice(prefix.length));
  return Number.isInteger(index) ? index : undefined;
}

export function isSimpleFilter(filter: FilterGroup): boolean {
  return (
    filter.isAdvanced !== true &&
    filter.conjunction === "and" &&
    !filter.items.some((item) => isFilterGroup(item))
  );
}
