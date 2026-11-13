// The files of a cell: images as small thumbnails, other files by name,
// and an image that does not load by its name too.
import "./files.css";
import { html, type TemplateResult } from "lit-html";
import type { CellContext } from "../../property-definition.ts";
import { fileSource, isImageFile, type FileEntry } from "./files-value.ts";

// An image that does not load shows its name instead.
function markBroken(event: Event): void {
  const holder = event.currentTarget;
  if (holder instanceof Element)
    holder.parentElement?.setAttribute("data-broken", "");
}

function renderFile(file: FileEntry, cell?: CellContext): TemplateResult {
  const source = fileSource(file, cell?.assetUrls ?? {});
  const name = html`<span class="files__name">${file.name}</span>`;
  if (isImageFile(file) && source !== undefined) {
    return html`<span class="files__image"
      ><img
        class="files__thumb"
        src=${source}
        alt=${file.name}
        @error=${markBroken}
      />${name}</span
    >`;
  }
  return name;
}

export function renderFilesCell(
  files: readonly FileEntry[],
  cell?: CellContext,
): TemplateResult {
  return html`<span class="files">
    ${files.map((file) => renderFile(file, cell))}
  </span>`;
}
