// The foot of the sidebar, as Notion's: the workspace, whose menu holds
// Settings and Import, then help and a menu of Templates and the trash.
import "./sidebar-footer.css";
import { html, nothing, type TemplateResult } from "lit-html";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon, type IconName } from "../../ui/icon/index.ts";
import { renderMenu, type MenuItem } from "../../ui/menu/index.ts";
import {
  SETTINGS_OVERLAY_KIND,
  SHORTCUT_HELP_OVERLAY_KIND,
} from "../../ui/shortcuts/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { TEMPLATE_GALLERY_OVERLAY } from "../templates/index.ts";
import { TRASH_OVERLAY } from "../trash/index.ts";
import { chooseImportFiles } from "./sidebar-import.ts";
import { selectWorkspaceName, workspaceMenuEntries } from "./workspace-menu.ts";

export const SIDEBAR_WORKSPACE_OVERLAY = "sidebar-workspace";
export const SIDEBAR_APPS_OVERLAY = "sidebar-apps";

const open = (kind: string, dispatch: Dispatch) => () =>
  dispatch(openOverlay.create({ overlay: { kind } }));

// A button that opens one of the foot's menus, and closes it when open.
function renderMenuButton(
  kind: string,
  content: { readonly label: string; readonly body: TemplateResult },
  context: { readonly state: AppState; readonly dispatch: Dispatch },
): TemplateResult {
  const { state, dispatch } = context;
  const isOpen = state.ui.overlay?.kind === kind;
  const isIconOnly = kind === SIDEBAR_APPS_OVERLAY;
  return html`<button
    type="button"
    class=${isIconOnly ? "sidebar__tool" : "sidebar__workspace"}
    data-overlay-anchor
    aria-haspopup="menu"
    aria-expanded=${String(isOpen)}
    aria-label=${content.label}
    title=${isIconOnly ? tooltipTitle(content.label) : nothing}
    interestfor=${isIconOnly ? TOOLTIP_TARGET : nothing}
    @click=${
      isOpen ? () => dispatch(closeOverlay.create({})) : open(kind, dispatch)
    }
  >
    ${content.body}
  </button>`;
}

function renderHelp(dispatch: Dispatch): TemplateResult {
  return html`<button
    type="button"
    class="sidebar__tool"
    aria-label=${COPY.sidebar.help}
    title=${tooltipTitle(COPY.sidebar.help)}
    interestfor=${TOOLTIP_TARGET}
    @click=${open(SHORTCUT_HELP_OVERLAY_KIND, dispatch)}
  >
    ${renderIcon("help")}
  </button>`;
}

export function renderSidebarFooter(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult {
  const context = { state, dispatch };
  const name = selectWorkspaceName(state);
  const workspace = html`<span class="sidebar__mark" aria-hidden="true"
      >${name.slice(0, 1)}</span
    >
    <span class="sidebar__workspace-name">${name}</span>
    ${renderIcon("chevron")}`;
  return html`<div class="sidebar__footer">
    ${renderMenuButton(
      SIDEBAR_WORKSPACE_OVERLAY,
      { label: name, body: workspace },
      context,
    )}
    ${renderHelp(dispatch)}
    ${renderMenuButton(
      SIDEBAR_APPS_OVERLAY,
      { label: COPY.sidebar.apps, body: renderIcon("templates") },
      context,
    )}
  </div>`;
}

function item(label: string, icon: IconName, onSelect: () => void): MenuItem {
  return { label, icon, onSelect };
}

function renderWorkspaceMenu(
  state: AppState,
  dispatch: Dispatch,
  items: readonly MenuItem[],
): TemplateResult {
  return renderMenu({
    label: COPY.sidebar.workspaceMenu,
    items: workspaceMenuEntries(state, dispatch, items),
    onClose: () => dispatch(closeOverlay.create({})),
  });
}

// The menu of the foot's button that is open, if one is.
export function renderSidebarMenu(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const kind = state.ui.overlay?.kind;
  const onClose = () => dispatch(closeOverlay.create({}));
  if (kind === SIDEBAR_WORKSPACE_OVERLAY) {
    return renderWorkspaceMenu(state, dispatch, [
      item(
        COPY.shell.openSettings,
        "settings",
        open(SETTINGS_OVERLAY_KIND, dispatch),
      ),
      item(COPY.sidebar.import, "download", () => {
        chooseImportFiles(dispatch);
      }),
    ]);
  }
  if (kind !== SIDEBAR_APPS_OVERLAY) return nothing;
  return renderMenu({
    label: COPY.sidebar.apps,
    items: [
      item(
        COPY.templates.open,
        "templates",
        open(TEMPLATE_GALLERY_OVERLAY, dispatch),
      ),
      item(COPY.trash.open, "trash", open(TRASH_OVERLAY, dispatch)),
    ],
    onClose,
  });
}
