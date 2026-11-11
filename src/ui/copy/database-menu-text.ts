// Text of a database's menus: the column menu and its submenus, and the
// view settings' sorts.
export const DATABASE_MENU_TEXT = {
  changeType: "Change type",
  // Notion's groups of a column's calculations.
  calculationGroups: {
    count: "Count",
    percent: "Percent",
    more: "More options",
  },
  sort: "Sort",
  insertLeft: "Insert left",
  insertRight: "Insert right",
  duplicateProperty: "Duplicate property",
  newPropertyName: "Property",
  // A copy of a property is named after it, as in Notion.
  copyName: (name: string) => `${name} (1)`,
  newSort: "New sort",
  sortBy: "Sort by…",
  filterBy: "Filter by…",
  clearDate: "Clear",
  addSort: "Add sort",
  deleteSort: "Delete sort",
  removeSort: "Remove sort",
  sortProperty: "Sort by property",
  sortDirection: "Sort direction",
  // The "…" and "+" on a group's header, named after the group.
  groupActions: (group: string) => `Actions for ${group}`,
  newInGroup: (group: string) => `New row in ${group}`,
  ascending: "Ascending",
  descending: "Descending",
} as const;
