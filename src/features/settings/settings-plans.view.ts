// Settings › Plans, drawn as Notion's and saying so (specification §1):
// the plan this server gives, and Upgrade, which needs Notion's payment.
import { html, type TemplateResult } from "lit-html";
import { COPY } from "../../ui/copy.ts";
import { renderRow } from "./settings-row.view.ts";

const TEXT = COPY.plans;

export function renderPlans(): TemplateResult {
  const upgrade = html`<button
    type="button"
    class="button"
    data-variant="primary"
    disabled
  >
    ${TEXT.upgrade}
  </button>`;
  return html`${renderRow(
    TEXT.current,
    TEXT.currentHint,
    html`<span>${TEXT.currentValue}</span>`,
  )}
  ${renderRow(TEXT.upgrade, TEXT.upgradeHint, upgrade)}`;
}
