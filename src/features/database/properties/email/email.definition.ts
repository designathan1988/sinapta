import { html } from "lit-html";
import { safeHref } from "../../../../model/index.ts";
import {
  compareText,
  containsText,
  IS_EMPTY,
  IS_NOT_EMPTY,
  type PropertyType,
} from "../../property-definition.ts";

// One address: something, an @, and a domain with a dot.
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function readEmail(stored: unknown): string | undefined {
  return typeof stored === "string" && EMAIL.test(stored) ? stored : undefined;
}

export const emailProperty: PropertyType = {
  type: "email",
  label: "Email",
  editor: "text",
  input: { type: "email", mode: "email" },
  read: readEmail,
  parse: (text) => readEmail(text.trim()),
  format: (value) => readEmail(value) ?? "",
  compare: compareText,
  filterOperators: [containsText(), IS_EMPTY, IS_NOT_EMPTY],
  renderCell(value) {
    const email = readEmail(value);
    const href = email === undefined ? undefined : safeHref(`mailto:${email}`);
    if (email === undefined || href === undefined) return "";
    return html`<a class="database__link" href=${href}>${email}</a>`;
  },
};
