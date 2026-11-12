// Notion's Rename from the sidebar: a small field over the page's row, its
// icon then its title, renamed as it is typed; Enter or Escape closes it.
import "./page-rename.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import {
  renamePage,
  selectPage,
  selectPageTitle,
} from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import type { MenuItem } from "../../ui/menu/index.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import {
  pageIdOfAnchor,
  pageMenuAnchorId,
  TREE_PLACE,
} from "./page-menu-anchor.ts";

export const PAGE_RENAME_OVERLAY = "page-rename";

export function renameItem(pageId: BlockId, dispatch: Dispatch): MenuItem {
  const anchorId = pageMenuAnchorId(TREE_PLACE, pageId);
  return {
    label: COPY.pageMenu.rename,
    icon: "compose",
    opens: "dialog",
    onSelect: () =>
      dispatch(
        openOverlay.create({
          overlay: { kind: PAGE_RENAME_OVERLAY, anchorId },
        }),
      ),
  };
}

export function renderPageRename(
  state: AppState,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const { overlay } = state.ui;
  if (overlay?.kind !== PAGE_RENAME_OVERLAY) return nothing;
  const page = selectPage(state, pageIdOfAnchor(overlay.anchorId) ?? null);
  if (page === undefined) return nothing;
  const close = () => dispatch(closeOverlay.create({}));
  const onInput = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    dispatch(renamePage.create({ pageId: page.id, title: event.target.value }));
  };
  const onKeyDown = (event: KeyboardEvent): void => {
    if (event.key !== "Enter" && event.key !== "Escape") return;
    event.preventDefault();
    close();
  };
  return html`<div
    class="page-rename"
    popover="manual"
    data-overlay
    ${ref(showPopoverWhenConnected)}
  >
    <span class="page-rename__icon" aria-hidden="true"
      >${page.props.icon ?? renderIcon("page")}</span
    >
    <input
      class="page-rename__field"
      aria-label=${COPY.pageMenu.renameField}
      placeholder=${COPY.sidebar.untitled}
      data-autofocus
      .value=${selectPageTitle(page)}
      @input=${onInput}
      @keydown=${onKeyDown}
    />
  </div>`;
}
