// A URL property's settings: one switch row, "Show full URL".
import { html, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { renderSwitchMark } from "../../../../ui/switch/index.ts";
import { readUrlConfig } from "./url.schema.ts";

export function renderUrlConfig(
  property: PropertyDefinition,
  onChange: (config: unknown) => void,
): TemplateResult {
  const { showFull } = readUrlConfig(property.config);
  return html`<button
    type="button"
    class="database__switch-row"
    role="switch"
    aria-checked=${String(showFull)}
    data-field="showFull"
    @click=${() => {
      onChange({ showFull: !showFull });
    }}
  >
    <span>${COPY.database.showFullUrl}</span>${renderSwitchMark(showFull)}
  </button>`;
}
