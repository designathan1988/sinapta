// The settings of a button property beside its name: its label, and
// "Edit automation", which opens what a press does in Notion's dialog.
import { html, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import { openOverlay, setOverlayDraft } from "../../../../state/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { renderIcon } from "../../../../ui/icon/index.ts";
import type { ConfigContext } from "../../property-definition.ts";
import { BUTTON_AUTOMATION_OVERLAY } from "./button-automation-overlay.ts";
import { readButtonPropertyConfig } from "./button-property.schema.ts";

const TEXT = COPY.database;

export function renderButtonPropertyConfig(
  property: PropertyDefinition,
  onChange: (config: unknown) => void,
  context: ConfigContext,
): TemplateResult {
  const config = readButtonPropertyConfig(property.config);
  const onLabel = (event: Event): void => {
    if (event.target instanceof HTMLInputElement) {
      onChange({ ...config, label: event.target.value.trim() });
    }
  };
  const edit = (): void => {
    const overlay = { kind: BUTTON_AUTOMATION_OVERLAY, anchorId: property.id };
    context.dispatch(openOverlay.create({ overlay }));
    context.dispatch(setOverlayDraft.create({ draft: config }));
  };
  return html`<label class="database__view-name">
      ${TEXT.buttonLabel}
      <input
        class="database__field"
        type="text"
        .value=${config.label}
        @change=${onLabel}
      />
    </label>
    <button type="button" class="database__switch-row" @click=${edit}>
      ${renderIcon("compose")}<span>${COPY.automation.edit}</span>
    </button>`;
}
