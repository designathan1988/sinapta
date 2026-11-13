import { compareText, type PropertyType } from "../../property-definition.ts";
import { TEXT_FILTERS } from "../../text-filters.ts";

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
  filterOperators: TEXT_FILTERS,
  defaultFilter: "contains",
  renderCell: (value) => readText(value) ?? "",
};
