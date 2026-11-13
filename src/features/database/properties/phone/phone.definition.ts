import { compareText, type PropertyType } from "../../property-definition.ts";
import { TEXT_FILTERS } from "../../text-filters.ts";
import { TEXT_GROUPING } from "../text/index.ts";

// Digits with the signs people write numbers with; kept as written.
const PHONE = /^\+?[\d\s().-]*\d[\d\s().-]*$/;

function readPhone(stored: unknown): string | undefined {
  return typeof stored === "string" && PHONE.test(stored) ? stored : undefined;
}

export const phoneProperty: PropertyType = {
  type: "phone",
  label: "Phone",
  icon: "phone",
  editor: "text",
  input: { type: "tel", mode: "tel" },
  read: readPhone,
  parse: (text) => readPhone(text.trim()),
  format: (value) => readPhone(value) ?? "",
  compare: compareText,
  filterOperators: TEXT_FILTERS,
  grouping: TEXT_GROUPING,
  defaultFilter: "contains",
  renderCell: (value) => readPhone(value) ?? "",
};
