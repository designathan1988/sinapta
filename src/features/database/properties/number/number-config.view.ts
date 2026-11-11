// The settings of a number property: its format, its currency, whether
// it shows as a number, a bar or a ring, and what a full bar stands for.
import { html, nothing, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { currencyChoices } from "./number-format.ts";
import {
  NUMBER_DISPLAYS,
  NUMBER_FORMATS,
  readNumberConfig,
  type NumberConfig,
} from "./number.schema.ts";

const TEXT = COPY.database;

interface Field {
  readonly name: string;
  readonly label: string;
  readonly choices: readonly (readonly [value: string, label: string])[];
  readonly current: string;
  readonly onPick: (value: string) => void;
}

function renderChoice(field: Field): TemplateResult {
  const onChange = (event: Event): void => {
    if (event.target instanceof HTMLSelectElement) {
      field.onPick(event.target.value);
    }
  };
  return html`<label class="database__view-name">
    ${field.label}
    <select
      class="database__field"
      data-field=${field.name}
      @change=${onChange}
    >
      ${field.choices.map(
        ([value, label]) =>
          html`<option value=${value} ?selected=${value === field.current}>
            ${label}
          </option>`,
      )}
    </select>
  </label>`;
}

function renderDivisor(
  config: NumberConfig,
  onChange: (config: NumberConfig) => void,
): TemplateResult {
  const onInput = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const divideBy = Number(event.target.value);
    if (Number.isFinite(divideBy) && divideBy > 0) {
      onChange({ ...config, divideBy });
    }
  };
  return html`<label class="database__view-name">
    ${TEXT.divideBy}
    <input
      class="database__field"
      type="number"
      min="0"
      data-field="divideBy"
      .value=${String(config.divideBy ?? 100)}
      @change=${onInput}
    />
  </label>`;
}

function isOneOf<T extends string>(
  list: readonly T[],
  value: string,
): value is T {
  return list.some((item) => item === value);
}

function renderCurrency(
  config: NumberConfig,
  onChange: (config: NumberConfig) => void,
): TemplateResult {
  return renderChoice({
    name: "currency",
    label: TEXT.currency,
    choices: currencyChoices().map((code) => [code, code]),
    current: config.currency ?? "USD",
    onPick: (value) => {
      onChange({ ...config, currency: value });
    },
  });
}

export function renderNumberConfig(
  property: PropertyDefinition,
  onChange: (config: unknown) => void,
): TemplateResult {
  const config = readNumberConfig(property.config);
  const format = renderChoice({
    name: "format",
    label: TEXT.numberFormat,
    choices: NUMBER_FORMATS.map((value) => [value, TEXT.numberFormats[value]]),
    current: config.format,
    onPick: (value) => {
      if (isOneOf(NUMBER_FORMATS, value))
        onChange({ ...config, format: value });
    },
  });
  const display = renderChoice({
    name: "display",
    label: TEXT.showAs,
    choices: NUMBER_DISPLAYS.map((value) => [
      value,
      TEXT.numberDisplays[value],
    ]),
    current: config.display,
    onPick: (value) => {
      if (isOneOf(NUMBER_DISPLAYS, value))
        onChange({ ...config, display: value });
    },
  });
  const currency =
    config.format === "currency" ? renderCurrency(config, onChange) : nothing;
  return html`${format} ${currency} ${display}
  ${config.display === "number" ? nothing : renderDivisor(config, onChange)}`;
}
