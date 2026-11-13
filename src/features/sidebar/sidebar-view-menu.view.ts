// The menu of a view kept in the sidebar, as Notion's: Rename; Open in;
// Show (5, 10, 15 or 20 pages); Show page icon; Source; View; then Move
// up, Move down and Remove section.
import { type TemplateResult, nothing } from "lit-html";
import type { SidebarView } from "../../model/index.ts";
import {
  closeOverlay,
  moveSidebarView,
  openOverlayPanel,
  removeSidebarView,
  setSidebarView,
  type AppState,
  type Dispatch,
  type SidebarViewChanges,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { IconName } from "../../ui/icon/index.ts";
import {
  renderMenu,
  renderMenuName,
  type MenuEntry,
  type MenuItem,
} from "../../ui/menu/index.ts";
import { LAYOUT_ICONS } from "../database/index.ts";
import { templateItem } from "./sidebar-view-template.ts";
import { selectSection, type Section } from "./sidebar-views.selectors.ts";
import { choiceItem, type ChoiceRow } from "./sidebar-view-choice.ts";
import { SIDEBAR_VIEW_OVERLAY } from "./sidebar-views.view.ts";

const TEXT = COPY.sidebarViews;
const RENAME_PANEL = "rename";
const LIMITS = [5, 10, 15, 20] as const;
const MODES = ["side", "center", "full"] as const;

interface Context {
  readonly state: AppState;
  readonly dispatch: Dispatch;
  readonly section: Section;
}

function change(context: Context, changes: SidebarViewChanges): void {
  const { viewId } = context.section.entry;
  context.dispatch(setSidebarView.create({ viewId, changes }));
}

function submenuOf(context: Context): string {
  return `sidebar-view-${context.section.entry.viewId}`;
}

function openInItem(context: Context): MenuItem {
  const current = context.section.entry.openMode ?? "side";
  const row: ChoiceRow<typeof current> = {
    label: TEXT.openIn,
    icon: "peek-side",
    id: "open",
    current,
  };
  return choiceItem(
    submenuOf(context),
    row,
    MODES.map((mode) => ({
      value: mode,
      label: COPY.peek.modes[mode],
      pick: () => {
        change(context, { openMode: mode });
      },
    })),
  );
}

function showItem(context: Context): MenuItem {
  const current = context.section.entry.limit ?? 5;
  const row: ChoiceRow<number> = {
    label: TEXT.show,
    icon: "number",
    id: "show",
    current,
  };
  return choiceItem(
    submenuOf(context),
    row,
    LIMITS.map((limit) => ({
      value: limit,
      label: String(limit),
      pick: () => {
        change(context, { limit });
      },
    })),
  );
}

function iconsItem(context: Context): MenuItem {
  const isHidden = context.section.entry.isIconHidden === true;
  return {
    label: TEXT.showPageIcon,
    icon: "smile",
    check: "switch",
    isChecked: !isHidden,
    onSelect: () => {
      change(context, { isIconHidden: !isHidden });
    },
  };
}

// The database the view reads, the only one it can.
function sourceItem(context: Context): MenuItem {
  const row = { label: TEXT.source, icon: "database", id: "source" } as const;
  const own = {
    value: "own",
    label: context.section.databaseName,
    pick: () => undefined,
  };
  return choiceItem(submenuOf(context), { ...row, current: "own" }, [own]);
}

function viewItem(context: Context): MenuItem {
  const { entry, viewIds } = context.section;
  const { views } = context.state.workspace;
  const icon = viewIcon(views[entry.viewId]?.type);
  const row = { label: TEXT.view, icon, id: "view", current: entry.viewId };
  return choiceItem(
    submenuOf(context),
    row,
    viewIds.flatMap((viewId) => {
      const other = views[viewId];
      if (other === undefined) return [];
      const pick = (): void => {
        change(context, { viewId });
      };
      return [{ value: viewId, label: other.name, pick }];
    }),
  );
}

function settingItems(context: Context): MenuEntry[] {
  return [
    openInItem(context),
    showItem(context),
    iconsItem(context),
    sourceItem(context),
    viewItem(context),
    templateItem(submenuOf(context), context.section, (templateId) => {
      change(context, { templateId });
    }),
  ];
}

function viewIcon(type: keyof typeof LAYOUT_ICONS | undefined): IconName {
  return type === undefined ? "table" : LAYOUT_ICONS[type];
}

function placeItems(
  context: Context,
  entries: readonly SidebarView[],
): MenuEntry[] {
  const { dispatch, section } = context;
  const { viewId } = section.entry;
  const index = entries.findIndex((entry) => entry.viewId === viewId);
  const move = (by: -1 | 1, label: string, icon: IconName): MenuItem[] =>
    entries[index + by] === undefined
      ? []
      : [
          {
            label,
            icon,
            onSelect: () => {
              dispatch(moveSidebarView.create({ viewId, by }));
            },
          },
        ];
  return [
    { kind: "divider" },
    ...move(-1, TEXT.moveUp, "up"),
    ...move(1, TEXT.moveDown, "down"),
    {
      label: TEXT.remove,
      icon: "close",
      onSelect: () => {
        dispatch(removeSidebarView.create({ viewId }));
      },
    },
  ];
}

function renameLead(context: Context): TemplateResult {
  return renderMenuName({
    icon: "database",
    label: TEXT.nameField,
    value: context.section.name,
    onRename: (name) => {
      change(context, { name });
    },
  });
}

export function renderSidebarViewMenu(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const overlay = state.ui.overlay;
  const entries = state.workspace.settings.sidebarViews ?? [];
  const entry = entries.find((one) => one.viewId === overlay?.anchorId);
  const section = entry === undefined ? undefined : selectSection(state, entry);
  if (overlay?.kind !== SIDEBAR_VIEW_OVERLAY || section === undefined) {
    return nothing;
  }
  const context = { state, dispatch, section };
  const rename: MenuItem = {
    label: TEXT.rename,
    icon: "compose",
    keepsOpen: true,
    onSelect: () => {
      dispatch(openOverlayPanel.create({ panel: RENAME_PANEL }));
    },
  };
  return renderMenu({
    label: TEXT.menu,
    items: [rename, ...settingItems(context), ...placeItems(context, entries)],
    onClose: () => dispatch(closeOverlay.create({})),
    context: { overlay, dispatch },
    ...(overlay.panel === RENAME_PANEL && { lead: renameLead(context) }),
  });
}
