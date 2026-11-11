// Version 20 adds nothing. Before it, records that a migration changed on
// load were not written back, while the new version was, with the next
// save of the workspace's meta. A stored view or row could so keep the
// shape of an older version under a newer one, and fail its schema on the
// next load. This brings every view, and every date stored as text, to
// the current shape; a record already in it stays as it is.
import { addDateRanges } from "./0014-date-ranges.ts";
import type { Migration } from "./run-migrations.ts";

type JsonRecord = Record<string, unknown>;

function isRecord(value: unknown): value is JsonRecord {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// Version 17: a board's group property became its grouping.
function groupByOf(view: JsonRecord): unknown {
  if (view.groupBy !== undefined) return view.groupBy;
  const { groupPropertyId } = view;
  if (view.type !== "board" || typeof groupPropertyId !== "string") {
    return undefined;
  }
  return {
    propertyId: groupPropertyId,
    sort: "manual",
    hideEmpty: false,
    collapsed: [],
    dateBy: "month",
  };
}

function repairView(view: unknown): unknown {
  if (!isRecord(view)) return view;
  const { filters, groupPropertyId: _groupPropertyId, ...rest } = view;
  const groupBy = groupByOf(view);
  return {
    ...rest,
    // Version 16: a list of filters became an and group of them.
    filter: isRecord(rest.filter)
      ? rest.filter
      : { conjunction: "and", items: Array.isArray(filters) ? filters : [] },
    ...(groupBy !== undefined && { groupBy }),
    // Versions 18 and 19 added these with nothing in them.
    calculations: isRecord(rest.calculations) ? rest.calculations : {},
    wrappedPropertyIds: Array.isArray(rest.wrappedPropertyIds)
      ? rest.wrappedPropertyIds
      : [],
    frozenCount: typeof rest.frozenCount === "number" ? rest.frozenCount : 0,
  };
}

export const repairStaleRecords: Migration = (file) => {
  const { views } = file;
  const repaired = isRecord(views)
    ? {
        ...file,
        views: Object.fromEntries(
          Object.entries(views).map(([id, view]) => [id, repairView(view)]),
        ),
      }
    : file;
  // Version 14 turns only a date still stored as text into a date value.
  return addDateRanges(repaired);
};
