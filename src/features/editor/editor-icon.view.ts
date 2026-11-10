import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { setPageIcon, type PageBlock } from "../../blocks/page/index.ts";
import { firstGrapheme } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  focusOverlayAnchor,
  showPopoverWhenConnected,
} from "../../ui/overlay/index.ts";

export const ICON_OVERLAY = "page-icon";

// The icon is the first whole character typed or pasted, however many
// code points it is made of.
function iconFrom(event: InputEvent): string {
  if (event.isComposing || !(event.target instanceof HTMLInputElement))
    return "";
  return firstGrapheme(event.target.value.trim());
}

function renderRemove(choose: (icon: null) => void): TemplateResult {
  return renderButton({
    label: COPY.icon.remove,
    onClick() {
      choose(null);
    },
  });
}

function renderPopover(page: PageBlock, dispatch: Dispatch): TemplateResult {
  const close = (): void => {
    focusOverlayAnchor();
    dispatch(closeOverlay.create({}));
  };
  const choose = (icon: string | null): void => {
    dispatch(setPageIcon.create({ pageId: page.id, icon }));
    close();
  };
  return html`<div
    class="editor__icon-popover"
    popover="manual"
    data-overlay
    ${ref(showPopoverWhenConnected)}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key === "Escape") close();
    }}
  >
    <label class="editor__icon-field">
      ${COPY.icon.fieldLabel}
      <input
        type="text"
        data-autofocus
        @input=${(event: InputEvent) => {
          const icon = iconFrom(event);
          if (icon !== "") choose(icon);
        }}
      />
    </label>
    ${page.props.icon === null ? nothing : renderRemove(choose)}
  </div>`;
}

// The page icon as a button that opens a small field to change it.
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
  return html`<button
      type="button"
      class="editor__icon"
      data-overlay-anchor
      aria-expanded=${String(isOpen)}
      aria-label=${icon === null ? nothing : COPY.icon.change}
      ?data-empty=${icon === null}
      @click=${toggle}
    >
      ${icon ?? COPY.icon.add}
    </button>
    ${isOpen ? renderPopover(page, dispatch) : nothing}`;
}
