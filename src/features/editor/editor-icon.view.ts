import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { setPageIcon, type PageBlock } from "../../blocks/page/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { renderEmojiPicker } from "../../ui/emoji/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon } from "../../ui/icon/index.ts";
import {
  focusOverlayAnchor,
  showPopoverWhenConnected,
} from "../../ui/overlay/index.ts";

export const ICON_OVERLAY = "page-icon";

function renderPopover(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): TemplateResult {
  const close = (): void => {
    focusOverlayAnchor();
    dispatch(closeOverlay.create({}));
  };
  const choose = (icon: string | null): void => {
    dispatch(setPageIcon.create({ pageId: page.id, icon }));
    close();
  };
  const overlay = state.ui.overlay ?? { kind: ICON_OVERLAY };
  return html`<div
    class="editor__icon-popover"
    popover="manual"
    data-overlay
    ${ref(showPopoverWhenConnected)}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    }}
  >
    ${renderEmojiPicker({
      query: overlay.query ?? "",
      onQuery: (query) =>
        dispatch(openOverlay.create({ overlay: { ...overlay, query } })),
      onChoose: choose,
      ...(page.props.icon !== null && {
        onRemove: () => {
          choose(null);
        },
      }),
    })}
  </div>`;
}

// The page icon as a button that opens the emoji picker to change it; a
// page without one shows "Add icon" among the actions over its title, a
// button like "Add cover", as Notion's.
export function renderIconControl(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): TemplateResult {
  const isOpen = state.ui.overlay?.kind === ICON_OVERLAY;
  const { icon } = page.props;
  const toggle = (): void => {
    dispatch(
      isOpen
        ? closeOverlay.create({})
        : openOverlay.create({ overlay: { kind: ICON_OVERLAY } }),
    );
  };
  const content =
    icon ?? html`${renderIcon("smile")}<span>${COPY.icon.add}</span>`;
  return html`<button
      type="button"
      class=${icon === null ? "button" : "editor__icon"}
      data-variant=${icon === null ? "quiet" : nothing}
      data-overlay-anchor
      aria-expanded=${String(isOpen)}
      aria-label=${icon === null ? nothing : COPY.icon.change}
      @click=${toggle}
    >
      ${content}
    </button>
    ${isOpen ? renderPopover(state, page, dispatch) : nothing}`;
}
