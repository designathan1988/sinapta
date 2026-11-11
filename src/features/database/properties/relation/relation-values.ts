// Reading and writing the page ids a relation cell holds.
import type { PageBlock } from "../../../../blocks/page/index.ts";
import type { Operation } from "../../../../model/index.ts";

// The ids a relation cell holds; undefined when it holds none.
export function readRelation(stored: unknown): string[] | undefined {
  if (!Array.isArray(stored)) return undefined;
  const ids = stored.filter(
    (id): id is string => typeof id === "string" && id !== "",
  );
  return ids.length === 0 ? undefined : [...new Set(ids)];
}

// The row with one value set, or removed when undefined or an empty list.
export function setValueOperation(
  row: PageBlock,
  propertyId: string,
  value: unknown,
): Operation {
  const { [propertyId]: _old, ...others } = row.props.values ?? {};
  const isEmpty =
    value === undefined || (Array.isArray(value) && value.length === 0);
  const values = isEmpty ? others : { ...others, [propertyId]: value };
  const props = { ...row.props, values };
  return { type: "record.update", kind: "block", id: row.id, patch: { props } };
}
