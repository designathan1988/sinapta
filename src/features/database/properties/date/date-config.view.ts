// The settings of a date property: how its days and times are written.
import { html, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import {
  DATE_FORMATS,
  readDateConfig,
  TIME_FORMATS,
  type DateConfig,
} from "./date.schema.ts";

const TEXT = COPY.database;

interface Choice<TValue extends string> {
  readonly name: keyof DateConfig;
  readonly label: string;
  readonly values: readonly TValue[];
  readonly labels: Readonly<Record<TValue, string>>;
}

function renderChoice<TValue extends string>(
  choice: Choice<TValue>,
  config: DateConfig,
  onChange: (config: DateConfig) => void,
): TemplateResult {
  const current = config[choice.name];
  const onPick = (event: Event): void => {
    if (!(event.target instanceof HTMLSelectElement)) return;
    const { value } = event.target;
    const picked = choice.values.find((item) => item === value);
    if (picked !== undefined) onChange({ ...config, [choice.name]: picked });
  };
  return html`<label class="database__view-name">
    ${choice.label}
    <select class="database__field" data-field=${choice.name} @change=${onPick}>
      ${choice.values.map(
        (value) =>
          html`<option value=${value} ?selected=${value === current}>
            ${choice.labels[value]}
          </option>`,
      )}
    </select>
  </label>`;
}

export function renderDateConfig(
  property: PropertyDefinition,
  onChange: (config: unknown) => void,
): TemplateResult {
  const config = readDateConfig(property.config);
  const dateFormat = renderChoice(
    {
      name: "dateFormat",
      label: TEXT.dateFormat,
      values: DATE_FORMATS,
      labels: TEXT.dateFormats,
    },
    config,
    onChange,
  );
  const timeFormat = renderChoice(
    {
      name: "timeFormat",
      label: TEXT.timeFormat,
      values: TIME_FORMATS,
      labels: TEXT.timeFormats,
    },
    config,
    onChange,
  );
  return html`${dateFormat} ${timeFormat}`;
}
