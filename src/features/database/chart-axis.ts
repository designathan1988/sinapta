// The property a chart groups its rows by: the one the view names, or
// else a status, a select, or the first property that can group.
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { DatabaseBlock } from "../../blocks/database/index.ts";
import type { View } from "../../model/index.ts";
import { isGroupable } from "./row-groups.selectors.ts";

const PREFERRED = ["status", "select"];

export function chartAxisProperty(
  database: DatabaseBlock,
  view: View,
): PropertyDefinition | undefined {
  const { properties } = database.props;
  const chosen = view.chart.groupByPropertyId;
  return (
    properties.find((item) => item.id === chosen) ??
    PREFERRED.flatMap((type) =>
      properties.filter((item) => item.type === type),
    )[0] ??
    properties.find(isGroupable)
  );
}
