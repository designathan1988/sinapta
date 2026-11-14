// The rows of a database as the views read them: each row's title and its
// cell values, stored or kept by the app on the row's record.
import {
  rowIdsOf,
  type DatabaseBlock,
  type PropertyDefinition,
} from "../../blocks/database/index.ts";
import {
  selectPage,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { ComputeContext } from "./property-definition.ts";
import { propertyType } from "./property-registry.ts";
import type { TableRow } from "./table-model.selectors.ts";

// A row's cell values: those stored on its page, and those the app keeps
// on the page's record, such as when it was created.
export function selectRowValues(
  page: PageBlock,
  properties: readonly PropertyDefinition[],
): Readonly<Record<string, unknown>> {
  const stored = page.props.values ?? {};
  const computed = properties.flatMap((property) => {
    const field = propertyType(property.type).computedFrom;
    if (field === undefined) return [];
    const value =
      field === "verification" ? page.props.verification : page[field];
    return [[property.id, value] as const];
  });
  return computed.length === 0
    ? stored
    : { ...stored, ...Object.fromEntries(computed) };
}

// A row's cell values with those worked out from the workspace, such as
// rollups, beside the stored ones.
export function selectAllRowValues(
  context: ComputeContext,
  page: PageBlock,
  properties: readonly PropertyDefinition[],
): Readonly<Record<string, unknown>> {
  const values = selectRowValues(page, properties);
  const computed = properties.flatMap((property) => {
    const compute = propertyType(property.type).compute;
    return compute === undefined
      ? []
      : [[property.id, compute(page, property, context)] as const];
  });
  return computed.length === 0
    ? values
    : { ...values, ...Object.fromEntries(computed) };
}

export function selectRows(
  context: ComputeContext,
  database: DatabaseBlock,
): TableRow[] {
  const { properties } = database.props;
  return rowIdsOf(database).flatMap((id) => {
    const page = selectPage(context.state, id);
    if (page === undefined || page.props.isTrashed) return [];
    const values = selectAllRowValues(context, page, properties);
    return [{ id, title: selectPageTitle(page), values }];
  });
}
