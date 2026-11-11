// A number in a cell: written in its property's format, beside a bar or a
// ring that shows its share of the divisor when the property asks for one.
import "./number.css";
import { html, svg, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import { formatNumber, numberShare } from "./number-format.ts";
import { readNumberConfig, type NumberConfig } from "./number.schema.ts";

// Shares are drawn on a scale of 100, so they read as percents.
const SCALE = 100;
const RING_RADIUS = 15.9155; // a circumference of 100

function renderShape(config: NumberConfig, share: number): TemplateResult {
  const filled = String(Math.round(share * SCALE));
  if (config.display === "ring") {
    return svg`<svg class="number__ring" viewBox="0 0 36 36" aria-hidden="true">
      <circle class="number__track" cx="18" cy="18" r=${RING_RADIUS} />
      <circle
        class="number__fill"
        cx="18"
        cy="18"
        r=${RING_RADIUS}
        stroke-dasharray=${`${filled} ${String(SCALE)}`}
      />
    </svg>`;
  }
  return svg`<svg
    class="number__bar"
    viewBox="0 0 ${SCALE} 4"
    preserveAspectRatio="none"
    aria-hidden="true"
  >
    <rect class="number__track" width=${SCALE} height="4" rx="2" />
    <rect class="number__fill" width=${filled} height="4" rx="2" />
  </svg>`;
}

export function renderNumberCell(
  value: number,
  property: PropertyDefinition,
): TemplateResult | string {
  const config = readNumberConfig(property.config);
  const text = formatNumber(value, config);
  if (config.display === "number") return text;
  return html`<span class="number">
    ${renderShape(config, numberShare(value, config))}
    <span>${text}</span>
  </span>`;
}
