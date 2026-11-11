// The rows of a database as the views read them: each row's title and its
// cell values, stored or kept by the app on the row's record.
import type {
  DatabaseBlock,
  PropertyDefinition,
} from "../../blocks/database/index.ts";
import {
  selectPage,
  selectPageTitle,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { AppState } from "../../state/index.ts";
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
    return field === undefined ? [] : [[property.id, page[field]] as const];
  });
  return computed.length === 0
    ? stored
    : { ...stored, ...Object.fromEntries(computed) };
}

export function selectRows(
  state: AppState,
  database: DatabaseBlock,
): TableRow[] {
  const { properties } = database.props;
  return database.childIds.flatMap((id) => {
    const page = selectPage(state, id);
    if (page === undefined || page.props.isTrashed) return [];
    const values = selectRowValues(page, properties);
    return [{ id, title: selectPageTitle(page), values }];
  });
}
