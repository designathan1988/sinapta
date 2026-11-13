// "Move to tab" in a section's menus, as Notion's: the sidebar's tabs,
// the section's own ticked; choosing one shows the section under it.
import {
  setSectionTab,
  type AppState,
  type Dispatch,
  type SidebarTab,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuEntry, MenuItem } from "../../ui/menu/index.ts";
import { selectTabOfSection } from "./sidebar-tabs.selectors.ts";

const TABS: readonly SidebarTab[] = ["home", "calendar"];

export function moveToTabItem(
  state: AppState,
  dispatch: Dispatch,
  key: string,
): MenuItem {
  const current = selectTabOfSection(state, key);
  const items = TABS.map((tab): MenuEntry => ({
    label: COPY.sidebarTabs[tab],
    icon: tab === "home" ? "home" : "calendar",
    check: "radio",
    isChecked: tab === current,
    keepsOpen: true,
    onSelect: () => {
      dispatch(setSectionTab.create({ key, tab }));
    },
  }));
  return {
    label: COPY.sidebarTabs.moveToTab,
    icon: "arrow-right",
    submenu: {
      id: `sidebar-move-tab-${key}`,
      menu: () => ({ label: COPY.sidebarTabs.moveToTab, items }),
    },
  };
}
