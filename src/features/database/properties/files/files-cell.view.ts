// The files of a cell: images as small thumbnails, other files by name.
import "./files.css";
import { html, type TemplateResult } from "lit-html";
import type { CellContext } from "../../property-definition.ts";
import { fileSource, isImageFile, type FileEntry } from "./files-value.ts";

function renderFile(file: FileEntry, cell?: CellContext): TemplateResult {
  const source = fileSource(file, cell?.assetUrls ?? {});
  if (isImageFile(file) && source !== undefined) {
    return html`<img class="files__thumb" src=${source} alt=${file.name} />`;
  }
  return html`<span class="files__name">${file.name}</span>`;
}

export function renderFilesCell(
  files: readonly FileEntry[],
  cell?: CellContext,
): TemplateResult {
  return html`<span class="files">
    ${files.map((file) => renderFile(file, cell))}
  </span>`;
}
