// Changes to a view's filter, addressed by a path: [i] is the i-th item
// of the top group, [i, j] the j-th condition of the group at i.
import type {
  Conjunction,
  Filter,
  FilterGroup,
  FilterItem,
  InnerFilterGroup,
} from "../../model/index.ts";
import { isFilterGroup } from "./filter-match.ts";

export type FilterPath = readonly number[];

function mapInner(
  group: FilterGroup,
  index: number,
  change: (inner: InnerFilterGroup) => FilterItem | undefined,
): FilterGroup {
  const items = group.items.flatMap((item, at) => {
    if (at !== index || !isFilterGroup(item)) return [item];
    const next = change(item);
    return next === undefined ? [] : [next];
  });
  return { ...group, items };
}

export function updateAt(
  group: FilterGroup,
  path: FilterPath,
  update: (filter: Filter) => Filter,
): FilterGroup {
  const [index = -1, inner] = path;
  if (inner === undefined) {
    const items = group.items.map((item, at) =>
      at === index && !isFilterGroup(item) ? update(item) : item,
    );
    return { ...group, items };
  }
  return mapInner(group, index, (found) => ({
    ...found,
    items: found.items.map((filter, at) =>
      at === inner ? update(filter) : filter,
    ),
  }));
}

// Removes the condition; a group left with none goes too.
export function removeAt(group: FilterGroup, path: FilterPath): FilterGroup {
  const [index = -1, inner] = path;
  if (inner === undefined) {
    return { ...group, items: group.items.filter((_, at) => at !== index) };
  }
  return mapInner(group, index, (found) => {
    const items = found.items.filter((_, at) => at !== inner);
    return items.length === 0 ? undefined : { ...found, items };
  });
}

// [] joins the top group's items; [i] the group at i.
export function setConjunction(
  group: FilterGroup,
  path: FilterPath,
  conjunction: Conjunction,
): FilterGroup {
  const [index] = path;
  if (index === undefined) return { ...group, conjunction };
  return mapInner(group, index, (found) => ({ ...found, conjunction }));
}

export function addFilter(
  group: FilterGroup,
  path: FilterPath,
  filter: Filter,
): FilterGroup {
  const [index] = path;
  if (index === undefined) return { ...group, items: [...group.items, filter] };
  return mapInner(group, index, (found) => ({
    ...found,
    items: [...found.items, filter],
  }));
}

export function addGroup(group: FilterGroup, filter: Filter): FilterGroup {
  const inner: InnerFilterGroup = { conjunction: "and", items: [filter] };
  return { ...group, items: [...group.items, inner] };
}
