import { COPY } from "../../../../ui/copy.ts";
import { html } from "lit-html";
import { safeHref } from "../../../../model/index.ts";
import { compareText, type PropertyType } from "../../property-definition.ts";
import { TEXT_FILTERS } from "../../text-filters.ts";
import { TEXT_GROUPING } from "../text/index.ts";

// One address: something, an @, and a domain with a dot.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readEmail(stored: unknown): string | undefined {
  return typeof stored === "string" && EMAIL.test(stored) ? stored : undefined;
}

export const emailProperty: PropertyType = {
  type: "email",
  label: COPY.propertyTypes.email,
  icon: "email",
  editor: "text",
  input: { type: "email", mode: "email" },
  read: readEmail,
  parse: (text) => readEmail(text.trim()),
  format: (value) => readEmail(value) ?? "",
  compare: compareText,
  filterOperators: TEXT_FILTERS,
  grouping: TEXT_GROUPING,
  defaultFilter: "contains",
  renderCell(value) {
    const email = readEmail(value);
    const href = email === undefined ? undefined : safeHref(`mailto:${email}`);
    if (email === undefined || href === undefined) return "";
    return html`<a class="database__link" href=${href}>${email}</a>`;
  },
};
