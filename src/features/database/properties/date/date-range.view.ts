// A date on a row's page: its first day, its last day and its time, each
// in its own field. The row's page reads them together on change.
import { html, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { readDateValue } from "./date-value.ts";

const TEXT = COPY.database;

function renderPart(
  name: string,
  label: string,
  value: string,
): TemplateResult {
  const type = name === "time" ? "time" : "date";
  return html`<input
    class="database__field"
    type=${type}
    data-part=${name}
    aria-label=${label}
    .value=${value}
  />`;
}

export function renderDateRange(
  stored: unknown,
  property: PropertyDefinition,
): TemplateResult {
  const date = readDateValue(stored);
  return html`<fieldset
    class="database__row-property"
    data-property-id=${property.id}
    data-date-range
  >
    <legend class="database__row-name">${property.name}</legend>
    <span class="database__row-options">
      ${renderPart("start", TEXT.startDate, date?.start ?? "")}
      ${renderPart("end", TEXT.endDate, date?.end ?? "")}
      ${renderPart("time", TEXT.time, date?.time ?? "")}
    </span>
  </fieldset>`;
}
