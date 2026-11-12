// A view's settings, as Notion shows them: one menu that moves between
// panels, its first panel listing each setting with its value. Which
// panel shows is the open overlay's panel, kept in the store.
import "./view-settings.css";
import type { TemplateResult } from "lit-html";
import { closeOverlay, setOverlayQuery } from "../../../state/index.ts";
import { COPY } from "../../../ui/copy.ts";
import { renderMenu } from "../../../ui/menu/index.ts";
import type { TableContext } from "../table-cell.view.ts";
import {
  calendarDatePanel,
  calendarModePanel,
  openModePanel,
  timelineDatePanel,
  cardPreviewPanel,
  cardSizePanel,
  groupByPanel,
  groupDatePanel,
  groupSortPanel,
  propertiesPanel,
} from "./choice-panels.ts";
import { chartKindPanel, chartXPanel, chartYPanel } from "./chart-panels.ts";
import { groupPanel, subGroupPanel } from "./group-panel.ts";
import { layoutPanel } from "./layout-panel.view.ts";
import { rootPanel } from "./root-panel.view.ts";
import { sortAddPanel, sortPanel } from "./sort-panel.view.ts";
import { goTo, type SettingsPanel } from "./settings-panel.ts";

export const VIEW_SETTINGS_OVERLAY = "view-settings";

const PANELS: Readonly<
  Record<string, (context: TableContext) => SettingsPanel>
> = {
  layout: layoutPanel,
  properties: propertiesPanel,
  sort: sortPanel,
  "sort-add": sortAddPanel,
  group: groupPanel,
  "sub-group": subGroupPanel,
  "group-by": groupByPanel,
  "group-sort": groupSortPanel,
  "group-date": groupDatePanel,
  "card-preview": cardPreviewPanel,
  "card-size": cardSizePanel,
  "calendar-date": calendarDatePanel,
  "calendar-mode": calendarModePanel,
  "open-mode": openModePanel,
  "timeline-date": timelineDatePanel,
  "chart-kind": chartKindPanel,
  "chart-x": chartXPanel,
  "chart-y": chartYPanel,
};

export function renderViewSettings(context: TableContext): TemplateResult {
  const { state, dispatch } = context;
  const name = state.ui.overlay?.panel;
  const build = name === undefined ? undefined : PANELS[name];
  const panel = build?.(context) ?? rootPanel(context);
  const { back, search, lead } = panel;
  return renderMenu({
    label: COPY.database.viewSettings,
    title: panel.title,
    items: panel.items,
    ...(lead !== undefined && { lead }),
    ...(back !== undefined && {
      onBack: () => {
        goTo(context, back);
      },
    }),
    ...(search !== undefined && {
      search: {
        placeholder: search,
        query: state.ui.overlay?.query ?? "",
        onQuery: (query) => dispatch(setOverlayQuery.create({ query })),
      },
    }),
    onClose: () => dispatch(closeOverlay.create({})),
  });
}
