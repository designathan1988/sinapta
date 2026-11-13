import { COPY } from "../../../../ui/copy.ts";
import { html } from "lit-html";
import { safeHref } from "../../../../model/index.ts";
import { compareText, type PropertyType } from "../../property-definition.ts";
import { TEXT_FILTERS } from "../../text-filters.ts";
import { TEXT_GROUPING } from "../text/index.ts";
import { renderUrlConfig } from "./url-config.view.ts";
import {
  DEFAULT_URL_CONFIG,
  readUrlConfig,
  urlConfigSchema,
} from "./url.schema.ts";

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
  label: COPY.propertyTypes.url,
  icon: "link",
  editor: "url",
  input: { mode: "url" },
  read: readUrl,
  parse: parseUrl,
  format: (value) => readUrl(value) ?? "",
  compare: compareText,
  filterOperators: TEXT_FILTERS,
  grouping: TEXT_GROUPING,
  defaultFilter: "contains",
  configSchema: urlConfigSchema,
  defaultConfig: () => DEFAULT_URL_CONFIG,
  renderConfigEditor: renderUrlConfig,
  renderCell(value, property) {
    const href = readUrl(value);
    if (href === undefined) return "";
    const shown = readUrlConfig(property.config).showFull
      ? href
      : href.replace(/^https?:\/\//, "").replace(/\/$/, "");
    return html`<a
      class="database__link"
      href=${href}
      rel="noreferrer"
      target="_blank"
      >${shown}</a
    >`;
  },
};
