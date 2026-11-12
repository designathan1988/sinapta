// A row of the settings, as Notion's: its name and a line that says what
// it does, then its control at the end.
import { html, type TemplateResult } from "lit-html";

export function renderRow(
  name: string,
  hint: string,
  control: TemplateResult,
): TemplateResult {
  return html`<div class="settings__row">
    <div class="settings__text">
      <span class="settings__name">${name}</span>
      <span class="settings__hint">${hint}</span>
    </div>
    ${control}
  </div>`;
}
