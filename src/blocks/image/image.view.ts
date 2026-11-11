import "./image.css";
import { html, type TemplateResult } from "lit-html";
import { safeImageSource } from "../../model/index.ts";
import type { Dispatch } from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderUrlField } from "../../ui/url-field/index.ts";
import { setImageCaption, setImageSource } from "./image.commands.ts";
import type { ImageBlock } from "./image.schema.ts";

// Images chosen from a file are kept in the workspace, so their size is
// capped to keep the stored and exported workspace small.
const MAX_IMAGE_BYTES = 5 * 1024 * 1024;

function readImageFile(block: ImageBlock, file: File, dispatch: Dispatch) {
  if (file.size > MAX_IMAGE_BYTES) {
    announce(COPY.blocks.imageTooLarge);
    return;
  }
  const reader = new FileReader();
  reader.addEventListener("load", () => {
    if (typeof reader.result !== "string") return;
    dispatch(setImageSource.create({ blockId: block.id, src: reader.result }));
  });
  reader.readAsDataURL(file);
}

function renderEmpty(block: ImageBlock, dispatch: Dispatch): TemplateResult {
  const { blocks } = COPY;
  return renderUrlField({
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
        readImageFile(block, file, dispatch);
      },
    },
  });
}

export function renderImage(
  block: ImageBlock,
  dispatch: Dispatch,
): TemplateResult {
  const { src, caption } = block.props;
  if (src === "") return renderEmpty(block, dispatch);
  const onCaption = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const value = event.target.value;
    dispatch(setImageCaption.create({ blockId: block.id, caption: value }));
  };
  return html`<figure class="image">
    <img
      class="image__picture"
      src=${src}
      alt=${caption}
      loading="lazy"
      decoding="async"
    />
    <figcaption>
      <input
        class="image__caption"
        type="text"
        aria-label=${COPY.blocks.imageCaption}
        placeholder=${COPY.blocks.imageCaptionPlaceholder}
        .value=${caption}
        @change=${onCaption}
      />
    </figcaption>
  </figure>`;
}
