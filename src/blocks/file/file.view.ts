import { html, nothing, type TemplateResult } from "lit-html";
import type { AppState, Dispatch } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  defineMediaCommands,
  isEmptyMedia,
  mediaAddress,
  renderMediaCaption,
  renderMediaEmpty,
  type MediaKind,
} from "../media/index.ts";
import { FILE_TYPE, type FileBlock } from "./file.schema.ts";

export const fileCommands = defineMediaCommands(FILE_TYPE);

const KIND: MediaKind = {
  commands: fileCommands,
  accept: "",
  text: COPY.media.file,
};

// The last part of a web address, as a file name.
function nameFromAddress(url: string): string {
  const path = URL.parse(url)?.pathname ?? "";
  const last = path
    .split("/")
    .filter((part) => part !== "")
    .at(-1);
  return last === undefined ? url : decodeURIComponent(last);
}

const UNITS = ["B", "KB", "MB", "GB"];

// A size such as "1.4 MB".
function formatSize(bytes: number): string {
  let value = bytes;
  let unit = 0;
  while (value >= 1024 && unit < UNITS.length - 1) {
    value /= 1024;
    unit += 1;
  }
  const digits = unit === 0 || value >= 10 ? 0 : 1;
  return `${value.toFixed(digits)} ${UNITS[unit] ?? "B"}`;
}

export function renderFile(
  block: FileBlock,
  dispatch: Dispatch,
  state: AppState,
): TemplateResult {
  if (isEmptyMedia(block.props)) {
    return renderMediaEmpty(block, KIND, { dispatch, state });
  }
  const address = mediaAddress(block.props, state);
  const { size } = block.props;
  const name = block.props.name ?? nameFromAddress(block.props.url);
  return html`<figure class="media">
    <div class="media__file">
      <span class="media__name">${name}</span>
      ${
        size === undefined
          ? nothing
          : html`<span class="media__size">${formatSize(size)}</span>`
      }
      <a
        class="media__link"
        data-media-source
        href=${address}
        download=${name}
        target="_blank"
        rel="noreferrer"
        >${COPY.media.download}</a
      >
    </div>
    ${renderMediaCaption(block, KIND, dispatch)}
  </figure>`;
}
