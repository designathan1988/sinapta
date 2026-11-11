import {
  compareText,
  containsText,
  IS_EMPTY,
  IS_NOT_EMPTY,
  type PropertyType,
} from "../../property-definition.ts";

function readText(stored: unknown): string | undefined {
  return typeof stored === "string" && stored !== "" ? stored : undefined;
}

export const textProperty: PropertyType = {
  type: "text",
  label: "Text",
  icon: "text",
  editor: "text",
  read: readText,
  parse: (text) => readText(text.normalize("NFC")),
  format: (value) => readText(value) ?? "",
  compare: compareText,
  filterOperators: [containsText(), IS_EMPTY, IS_NOT_EMPTY],
  renderCell: (value) => readText(value) ?? "",
};
