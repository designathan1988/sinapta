// The settings of a number property: its format, its currency, whether
// it shows as a number, a bar or a ring, and what a full bar stands for.
import { html, nothing, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import type { ConfigContext } from "../../property-definition.ts";
import { renderConfigChoice } from "../config-choice.view.ts";
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
  readonly isSearchable?: boolean;
}

interface Editing {
  readonly property: PropertyDefinition;
  readonly context: ConfigContext;
}

function renderChoice(field: Field, editing: Editing): TemplateResult {
  return renderConfigChoice(
    {
      id: `${editing.property.id}-${field.name}`,
      label: field.label,
      value: field.current,
      options: field.choices.map(([value, label]) => ({ value, label })),
      onChoose: field.onPick,
      ...(field.isSearchable === true && { searchPlaceholder: field.label }),
    },
    editing.context,
  );
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
  editing: Editing,
): TemplateResult {
  return renderChoice(
    {
      name: "currency",
      label: TEXT.currency,
      choices: currencyChoices().map((code) => [code, code]),
      current: config.currency ?? "USD",
      isSearchable: true,
      onPick: (value) => {
        onChange({ ...config, currency: value });
      },
    },
    editing,
  );
}

function renderFormat(
  config: NumberConfig,
  onChange: (config: NumberConfig) => void,
  editing: Editing,
): TemplateResult {
  return renderChoice(
    {
      name: "format",
      label: TEXT.numberFormat,
      choices: NUMBER_FORMATS.map((value) => [
        value,
        TEXT.numberFormats[value],
      ]),
      current: config.format,
      onPick: (value) => {
        if (isOneOf(NUMBER_FORMATS, value))
          onChange({ ...config, format: value });
      },
    },
    editing,
  );
}

function renderDisplay(
  config: NumberConfig,
  onChange: (config: NumberConfig) => void,
  editing: Editing,
): TemplateResult {
  return renderChoice(
    {
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
    },
    editing,
  );
}

export function renderNumberConfig(
  property: PropertyDefinition,
  onChange: (config: unknown) => void,
  context: ConfigContext,
): TemplateResult {
  const config = readNumberConfig(property.config);
  const editing = { property, context };
  const currency =
    config.format === "currency"
      ? renderCurrency(config, onChange, editing)
      : nothing;
  return html`${renderFormat(config, onChange, editing)} ${currency}
  ${renderDisplay(config, onChange, editing)}
  ${config.display === "number" ? nothing : renderDivisor(config, onChange)}`;
}
