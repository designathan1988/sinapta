import { html } from "lit-html";
import { safeHref } from "../../../../model/index.ts";
import {
  compareText,
  containsText,
  IS_EMPTY,
  IS_NOT_EMPTY,
  type PropertyType,
} from "../../property-definition.ts";

// Only http, https and mailto addresses are stored.
function readUrl(stored: unknown): string | undefined {
  return typeof stored === "string" ? safeHref(stored) : undefined;
}

// "example.com" is taken to mean "https://example.com".
function parseUrl(text: string): string | undefined {
  const trimmed = text.trim();
  if (trimmed === "") return undefined;
  return readUrl(trimmed) ?? readUrl(`https://${trimmed}`);
}

export const urlProperty: PropertyType = {
  type: "url",
  label: "URL",
  editor: "url",
  input: { mode: "url" },
  read: readUrl,
  parse: parseUrl,
  format: (value) => readUrl(value) ?? "",
  compare: compareText,
  filterOperators: [containsText(), IS_EMPTY, IS_NOT_EMPTY],
  renderCell(value) {
    const href = readUrl(value);
    if (href === undefined) return "";
    return html`<a
      class="database__link"
      href=${href}
      rel="noreferrer"
      target="_blank"
      >${href.replace(/^https?:\/\//, "").replace(/\/$/, "")}</a
    >`;
  },
};
