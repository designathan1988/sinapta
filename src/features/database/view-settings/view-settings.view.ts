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
// The toolbar's Sort, as Notion's: the sort panels of the view settings,
// in a popover of their own.
export const VIEW_SORTS_OVERLAY = "view-sorts";
// The sort pill under the toolbar opens the same panels.
const SORT_KINDS: ReadonlySet<string> = new Set([
  VIEW_SORTS_OVERLAY,
  "view-sort-pill",
]);

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

// The panel the overlay opens on: the settings' list of settings, or the
// sorts, which with none go straight to choosing one.
function firstPanel(context: TableContext): string | undefined {
  if (!SORT_KINDS.has(context.state.ui.overlay?.kind ?? "")) return undefined;
  return context.model.view.sorts.length > 0 ? "sort" : "sort-add";
}

// Where the back button goes; none when it would show this panel again.
function backTo(
  context: TableContext,
  panel: SettingsPanel,
  name: string | undefined,
): string | null | undefined {
  const { back } = panel;
  if (back === undefined) return undefined;
  const shown = back ?? firstPanel(context);
  return shown !== undefined && shown === name ? undefined : back;
}

// The open panel's name: the one the overlay moved to, else its first.
function panelName(context: TableContext): string | undefined {
  const moved: string | undefined = context.state.ui.overlay?.panel;
  return moved ?? firstPanel(context);
}

// The search over a panel's rows, for the panels that have one.
function panelSearch(context: TableContext, placeholder: string | undefined) {
  const { state, dispatch } = context;
  if (placeholder === undefined) return {};
  return {
    search: {
      placeholder,
      query: state.ui.overlay?.query ?? "",
      onQuery: (query: string) => dispatch(setOverlayQuery.create({ query })),
    },
  };
}

export function renderViewSettings(context: TableContext): TemplateResult {
  const name = panelName(context);
  const build = name === undefined ? undefined : PANELS[name];
  const panel = build?.(context) ?? rootPanel(context);
  const { lead } = panel;
  const back = backTo(context, panel, name);
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
    ...panelSearch(context, panel.search),
    onClose: () => context.dispatch(closeOverlay.create({})),
  });
}
