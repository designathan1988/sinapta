import "./media.css";
import { html, type TemplateResult } from "lit-html";
import { safeWebAddress, type Block } from "../../model/index.ts";
import {
  attachAsset,
  failAsset,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { saveAssetFile } from "../../ui/asset/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderUrlField } from "../../ui/url-field/index.ts";
import type { MediaCommands } from "./media.commands.ts";
import type { MediaProps } from "./media.schema.ts";

// What differs between the media block types.
export interface MediaKind {
  readonly commands: MediaCommands;
  // The `accept` attribute of the file choice, such as "video/*".
  readonly accept: string;
  readonly text: {
    readonly label: string;
    readonly placeholder: string;
    readonly upload: string;
  };
}

export interface MediaContext {
  readonly dispatch: Dispatch;
  readonly state: AppState;
}

export type MediaBlock = Block & { readonly props: MediaProps };

// A chosen file goes to the asset store with its name and size; the
// block gets it, or shows why it could not be kept.
function keepFile(block: MediaBlock, file: File, dispatch: Dispatch): void {
  const blockId = block.id;
  const { name, size } = file;
  void saveAssetFile(file, name).then((result) => {
    dispatch(
      result.ok
        ? attachAsset.create({
            blockId,
            assetId: result.id,
            url: result.url,
            name,
            size,
          })
        : failAsset.create({ blockId, error: result.error }),
    );
  });
}

// A field for a secure web address, or a file to keep.
export function renderMediaEmpty(
  block: MediaBlock,
  kind: MediaKind,
  { dispatch, state }: MediaContext,
): TemplateResult {
  const { assetError } = state.persistence;
  const error = assetError?.blockId === block.id ? assetError.error : undefined;
  const field = renderUrlField({
    label: kind.text.label,
    placeholder: kind.text.placeholder,
    submitLabel: COPY.media.submit,
    invalidMessage: COPY.media.invalid,
    isValid: (value) => safeWebAddress(value) !== undefined,
    onSubmit: (url) =>
      dispatch(kind.commands.setUrl.create({ blockId: block.id, url })),
    file: {
      label: kind.text.upload,
      accept: kind.accept,
      onFile: (file) => {
        keepFile(block, file, dispatch);
      },
    },
  });
  if (error === undefined) return field;
  return html`${field}
    <p class="media__error" role="alert">${COPY.blocks.assetErrors[error]}</p>`;
}

export function renderMediaCaption(
  block: MediaBlock,
  kind: MediaKind,
  dispatch: Dispatch,
): TemplateResult {
  const onChange = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const caption = event.target.value;
    dispatch(kind.commands.setCaption.create({ blockId: block.id, caption }));
  };
  return html`<input
    class="media__caption"
    type="text"
    aria-label=${COPY.media.caption}
    placeholder=${COPY.media.captionPlaceholder}
    .value=${block.props.caption}
    @change=${onChange}
  />`;
}
