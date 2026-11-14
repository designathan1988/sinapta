import "./image.css";
import { html, nothing, type TemplateResult } from "lit-html";
import { ref } from "lit-html/directives/ref.js";
import { safeImageSource } from "../../model/index.ts";
import {
  attachAsset,
  failAsset,
  openOverlay,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { saveAssetFile } from "../../ui/asset/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderIcon, type IconName } from "../../ui/icon/index.ts";
import { TOOLTIP_TARGET, tooltipTitle } from "../../ui/tooltip/index.ts";
import { renderUrlField } from "../../ui/url-field/index.ts";
import {
  setImageAlign,
  setImageCaption,
  setImageSource,
} from "./image.commands.ts";
import {
  renderWidthHandles,
  setImageWidthProperty,
} from "./image-resize.view.ts";
import {
  IMAGE_VIEWER_OVERLAY,
  renderImageViewer,
} from "./image-viewer.view.ts";
import { IMAGE_WIDTH, type ImageBlock } from "./image.schema.ts";
import { imageAddress, isEmptyImage } from "./image-address.ts";

export { IMAGE_VIEWER_OVERLAY };

// A chosen file goes to the asset store; the block gets the asset, or
// shows why it could not be kept.
function keepImageFile(block: ImageBlock, file: File, dispatch: Dispatch) {
  const blockId = block.id;
  void saveAssetFile(file, file.name).then((result) => {
    dispatch(
      result.ok
        ? attachAsset.create({ blockId, assetId: result.id, url: result.url })
        : failAsset.create({ blockId, error: result.error }),
    );
  });
}

function renderEmpty(
  block: ImageBlock,
  dispatch: Dispatch,
  state: AppState,
): TemplateResult {
  const { blocks } = COPY;
  const { assetError } = state.persistence;
  const error = assetError?.blockId === block.id ? assetError.error : undefined;
  const field = renderUrlField({
    label: blocks.imageLabel,
    placeholder: blocks.imagePlaceholder,
    submitLabel: blocks.imageSubmit,
    invalidMessage: blocks.imageInvalid,
    isValid: (value) => safeImageSource(value) !== undefined,
    onSubmit: (src) =>
      dispatch(setImageSource.create({ blockId: block.id, src })),
    file: {
      label: blocks.imageUpload,
      accept: "image/png, image/jpeg, image/gif, image/webp, image/avif",
      onFile: (file) => {
        keepImageFile(block, file, dispatch);
      },
    },
  });
  if (error === undefined) return field;
  return html`${field}
    <p class="image__error" role="alert">${blocks.assetErrors[error]}</p>`;
}

const ALIGN_BUTTONS = [
  ["left", "align-left", COPY.imageBlock.alignLeft],
  ["center", "align-center", COPY.imageBlock.alignCenter],
  ["right", "align-right", COPY.imageBlock.alignRight],
] as const;

interface Tool {
  readonly label: string;
  readonly icon: IconName;
  readonly onClick: () => void;
  readonly isPressed?: boolean;
}

function toolButton(tool: Tool): TemplateResult {
  const { label, isPressed } = tool;
  return html`<button
    type="button"
    class="image__tool"
    aria-label=${label}
    aria-pressed=${isPressed === undefined ? nothing : String(isPressed)}
    title=${tooltipTitle(label)}
    interestfor=${TOOLTIP_TARGET}
    @click=${tool.onClick}
  >
    ${renderIcon(tool.icon)}
  </button>`;
}

// Over the image while it is pointed at or focused: alignment and the
// full screen view.
function renderToolbar(block: ImageBlock, dispatch: Dispatch) {
  const blockId = block.id;
  const current = block.props.align ?? "center";
  const align = ALIGN_BUTTONS.map(([value, icon, label]) =>
    toolButton({
      label,
      icon,
      onClick: () => dispatch(setImageAlign.create({ blockId, align: value })),
      isPressed: value === current,
    }),
  );
  const overlay = { kind: IMAGE_VIEWER_OVERLAY, anchorId: blockId };
  const fullScreen = toolButton({
    label: COPY.imageBlock.fullScreen,
    icon: "expand",
    onClick: () => dispatch(openOverlay.create({ overlay })),
  });
  return html`<div class="image__toolbar">${align}${fullScreen}</div>`;
}

function renderCaption(block: ImageBlock, dispatch: Dispatch) {
  const onCaption = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const caption = event.target.value;
    dispatch(setImageCaption.create({ blockId: block.id, caption }));
  };
  return html`<figcaption>
    <input
      class="image__caption"
      type="text"
      aria-label=${COPY.blocks.imageCaption}
      placeholder=${COPY.blocks.imageCaptionPlaceholder}
      .value=${block.props.caption}
      @change=${onCaption}
    />
  </figcaption>`;
}

export function renderImage(
  block: ImageBlock,
  dispatch: Dispatch,
  state: AppState,
): TemplateResult {
  if (isEmptyImage(block)) return renderEmpty(block, dispatch, state);
  const { caption } = block.props;
  const src = imageAddress(block, state);
  const width = block.props.width ?? IMAGE_WIDTH.max;
  const sized = ref((element) => {
    setImageWidthProperty(element, width);
  });
  return html`<figure
    class="image"
    data-align=${block.props.align ?? "center"}
    ?data-sized=${block.props.width !== undefined}
    ${sized}
  >
    <div class="image__frame">
      ${
        src === ""
          ? nothing
          : html`<img
              class="image__picture"
              src=${src}
              alt=${caption}
              loading="lazy"
              decoding="async"
            />`
      }
      ${renderWidthHandles(block, dispatch)} ${renderToolbar(block, dispatch)}
    </div>
    ${renderCaption(block, dispatch)}
    ${renderImageViewer(block, state, dispatch)}
  </figure>`;
}
