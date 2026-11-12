// Each layout's icon, as Notion shows it in tabs and menus.
import type { ViewType } from "../../model/index.ts";
import type { IconName } from "../../ui/icon/index.ts";

export const LAYOUT_ICONS: Readonly<Record<ViewType, IconName>> = {
  table: "table",
  board: "board",
  gallery: "gallery",
  list: "list",
  calendar: "calendar",
  timeline: "timeline",
  chart: "chart",
  form: "form",
  feed: "feed",
};
