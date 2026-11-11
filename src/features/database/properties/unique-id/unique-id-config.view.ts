// The settings of a unique ID property: the text before each number.
import { html, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { readUniqueIdConfig } from "./unique-id.schema.ts";

export function renderUniqueIdConfig(
  property: PropertyDefinition,
  onChange: (config: unknown) => void,
): TemplateResult {
  const config = readUniqueIdConfig(property.config);
  const onPrefix = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const prefix = event.target.value.trim().normalize("NFC");
    onChange({ ...config, prefix });
  };
  return html`<label class="database__view-name">
    ${COPY.database.idPrefix}
    <input
      class="database__field"
      type="text"
      data-field="prefix"
      .value=${config.prefix}
      @change=${onPrefix}
    />
  </label>`;
}
