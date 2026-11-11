// A page's cover: a band of color or an image above the title, with a
// picker to change it. Only pages have covers.
import "./editor-cover.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import {
  COVER_PRESETS,
  coverFor,
  setPageCover,
  type PageBlock,
} from "../../blocks/page/index.ts";
import { safeImageSource } from "../../model/index.ts";
import {
  closeOverlay,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { whenConnected } from "../../ui/focus/index.ts";
import { showPopoverWhenConnected } from "../../ui/overlay/index.ts";
import { renderUrlField } from "../../ui/url-field/index.ts";
import {
  coverPositionOf,
  coverSliderHandlers,
  isRepositioning,
  renderRepositionControls,
} from "./editor-cover-position.view.ts";

export { COVER_POSITION_OVERLAY } from "./editor-cover-position.view.ts";

export const COVER_OVERLAY = "page-cover";

function isPreset(cover: string): cover is (typeof COVER_PRESETS)[number] {
  return COVER_PRESETS.some((preset) => preset === cover);
}

function renderPresets(
  page: PageBlock,
  choose: (cover: string) => void,
): TemplateResult {
  return html`<div class="editor__cover-presets">
    ${COVER_PRESETS.map(
      (preset) =>
        html`<button
          type="button"
          class="editor__cover-preset"
          data-cover=${preset}
          aria-label=${COPY.cover.presets[preset]}
          aria-pressed=${String(page.props.cover === preset)}
          @click=${() => {
            choose(preset);
          }}
        ></button>`,
    )}
  </div>`;
}

function renderPicker(page: PageBlock, dispatch: Dispatch): TemplateResult {
  const choose = (cover: string | null): void => {
    dispatch(setPageCover.create({ pageId: page.id, cover }));
    dispatch(closeOverlay.create({}));
  };
  return html`<div
    class="editor__cover-picker"
    popover="manual"
    data-overlay
    ${ref(showPopoverWhenConnected)}
    @keydown=${(event: KeyboardEvent) => {
      if (event.key === "Escape") dispatch(closeOverlay.create({}));
    }}
  >
    <p class="editor__cover-heading">${COPY.cover.colors}</p>
    ${renderPresets(page, choose)}
    ${renderUrlField({
      label: COPY.cover.imageLabel,
      placeholder: COPY.cover.imagePlaceholder,
      submitLabel: COPY.cover.imageSubmit,
      invalidMessage: COPY.cover.imageInvalid,
      isValid: (value) => safeImageSource(value)?.startsWith("http") === true,
      onSubmit: choose,
    })}
    ${renderButton({
      label: COPY.cover.remove,
      variant: "danger",
      onClick: () => {
        choose(null);
      },
    })}
  </div>`;
}

function renderChangeButton(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): TemplateResult {
  const isOpen = state.ui.overlay?.kind === COVER_OVERLAY;
  const overlay = { kind: COVER_OVERLAY, anchorId: page.id };
  return html`<button
    type="button"
    class="button editor__cover-change"
    data-variant="quiet"
    data-overlay-anchor
    aria-haspopup="dialog"
    aria-expanded=${String(isOpen)}
    @click=${() =>
      dispatch(
        isOpen ? closeOverlay.create({}) : openOverlay.create({ overlay }),
      )}
  >
    ${COPY.cover.change}
  </button>`;
}

// The image of an image cover; a slider over it while it is repositioned.
function renderImage(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): TemplateResult {
  const image = html`<img
    class="editor__cover-image"
    src=${page.props.cover ?? ""}
    alt=""
    draggable="false"
  />`;
  if (!isRepositioning(state)) return image;
  const handlers = coverSliderHandlers(page, dispatch);
  return html`<div
    class="editor__cover-slider"
    role="slider"
    tabindex="0"
    aria-label=${COPY.cover.position}
    aria-orientation="vertical"
    aria-valuemin="0"
    aria-valuemax="100"
    aria-valuenow=${coverPositionOf(page)}
    @keydown=${handlers.onKeyDown}
    @pointerdown=${handlers.onPointerDown}
    @pointermove=${handlers.onPointerMove}
    @pointerup=${handlers.onPointerUp}
    ${ref(whenConnectedFocus)}
  >
    ${image}
  </div>`;
}

function whenConnectedFocus(element: Element | undefined): void {
  if (element instanceof HTMLElement) {
    whenConnected(element, () => {
      element.focus({ preventScroll: true });
    });
  }
}

// The cover spans the whole main area; an image is cut at the page's
// position, a color preset fills it.
export function renderCover(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  const { cover } = page.props;
  if (cover === undefined || cover === null) return nothing;
  const isOpen = state.ui.overlay?.kind === COVER_OVERLAY;
  const isImage = !isPreset(cover);
  const position = `${String(coverPositionOf(page))}%`;
  return html`<div
    class="editor__cover"
    data-cover=${isImage ? nothing : cover}
    ?data-overlay=${isRepositioning(state)}
    ${ref((element) => {
      if (element instanceof HTMLElement) {
        element.style.setProperty("--editor-cover-y", position);
      }
    })}
  >
    ${isImage ? renderImage(state, page, dispatch) : nothing}
    <div class="editor__cover-actions">
      ${isImage ? renderRepositionControls(state, dispatch) : nothing}
      ${
        isRepositioning(state)
          ? nothing
          : renderChangeButton(state, page, dispatch)
      }
    </div>
    ${isOpen ? renderPicker(page, dispatch) : nothing}
  </div>`;
}

// Adds a cover in the colors this page gets by default; the picker then
// changes it.
export function renderAddCover(
  page: PageBlock,
  dispatch: Dispatch,
): TemplateResult | typeof nothing {
  if (page.props.cover != null) return nothing;
  return renderButton({
    label: COPY.cover.add,
    onClick: () =>
      dispatch(
        setPageCover.create({ pageId: page.id, cover: coverFor(page.id) }),
      ),
  });
}
