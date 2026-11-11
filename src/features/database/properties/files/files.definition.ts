// A files property: files kept with the workspace and links to files on
// the web, shown as thumbnails and names.
import {
  containsText,
  IS_EMPTY,
  IS_NOT_EMPTY,
  type PropertyType,
} from "../../property-definition.ts";
import { renderFilesCell } from "./files-cell.view.ts";
import { readFiles } from "./files-value.ts";

function names(value: unknown): string {
  return (readFiles(value) ?? []).map((file) => file.name).join(", ");
}

export const filesProperty: PropertyType = {
  type: "files",
  label: "Files & media",
  editor: "files",
  read: readFiles,
  // Files are added in their own editor, never typed.
  parse: (_text, previous) => readFiles(previous),
  format: names,
  compare: (a, b) => names(a).localeCompare(names(b)),
  filterOperators: [
    {
      ...containsText("Name contains"),
      test: (value, operand) => containsText().test(names(value), operand),
    },
    IS_EMPTY,
    IS_NOT_EMPTY,
  ],
  renderCell(value, _property, cell) {
    const files = readFiles(value);
    return files === undefined ? "" : renderFilesCell(files, cell);
  },
};
