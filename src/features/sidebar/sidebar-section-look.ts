// How a sidebar section reads in "Customize sidebar": its icon and name.
// Favorites and Private are built in; a kept view shows its section's
// name and its layout's icon.
import type { AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { IconName } from "../../ui/icon/index.ts";
import { LAYOUT_ICONS } from "../database/index.ts";
import {
  sectionViewId,
  type BuiltInSection,
} from "./sidebar-layout.selectors.ts";
import { selectSection } from "./sidebar-views.selectors.ts";

export interface SectionLook {
  readonly label: string;
  readonly icon: IconName;
}

const BUILT_IN: Readonly<Record<BuiltInSection, SectionLook>> = {
  favorites: { label: COPY.favorites.heading, icon: "star" },
  private: { label: COPY.sidebar.private, icon: "lock" },
};

export function builtInSectionLook(key: BuiltInSection): SectionLook {
  return BUILT_IN[key];
}

export function sectionLook(
  state: AppState,
  key: string,
): SectionLook | undefined {
  if (key === "favorites" || key === "private") return BUILT_IN[key];
  const viewId = sectionViewId(state, key);
  const entry = (state.workspace.settings.sidebarViews ?? []).find(
    (one) => one.viewId === viewId,
  );
  const section = entry === undefined ? undefined : selectSection(state, entry);
  const view = viewId === undefined ? undefined : state.workspace.views[viewId];
  if (section === undefined || view === undefined) return undefined;
  return { label: section.name, icon: LAYOUT_ICONS[view.type] };
}
