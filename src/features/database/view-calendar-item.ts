// "Manage in calendar" at the end of a view's tab menu, as Notion's
// "Manage in Notion Calendar": for a database with dates, it lists the
// view's dated pages in the sidebar's Calendar tab, or stops.
import { setCalendarView } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuEntry } from "../../ui/menu/index.ts";
import type { TableContext } from "./table-cell.view.ts";

export function calendarItems(context: TableContext): MenuEntry[] {
  const { model, state, dispatch } = context;
  const hasDates = model.database.props.properties.some(
    (property) => property.type === "date",
  );
  if (!hasDates) return [];
  const viewId = model.view.id;
  const isShown =
    state.workspace.settings.calendarViewIds?.includes(viewId) === true;
  return [
    { kind: "divider" },
    {
      label: COPY.sidebarTabs.manageInCalendar,
      icon: "calendar",
      check: "box",
      isChecked: isShown,
      onSelect: () => {
        dispatch(setCalendarView.create({ viewId, isShown: !isShown }));
      },
    },
  ];
}
