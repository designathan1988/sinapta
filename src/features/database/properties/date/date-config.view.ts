// The settings of a date property: how its days and times are written.
import { html, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { renderConfigChoice } from "../config-choice.view.ts";
import type { ConfigContext } from "../../property-definition.ts";
import {
  DATE_FORMATS,
  readDateConfig,
  TIME_FORMATS,
  type DateConfig,
} from "./date.schema.ts";

const TEXT = COPY.database;

interface Choice<TValue extends string> {
  readonly name: "dateFormat" | "timeFormat";
  readonly label: string;
  readonly values: readonly TValue[];
  readonly labels: Readonly<Record<TValue, string>>;
}

interface Editing {
  readonly property: PropertyDefinition;
  readonly config: DateConfig;
  readonly onChange: (config: DateConfig) => void;
  readonly context: ConfigContext;
}

function renderChoice<TValue extends string>(
  choice: Choice<TValue>,
  editing: Editing,
): TemplateResult {
  const { config, onChange } = editing;
  return renderConfigChoice(
    {
      id: `${editing.property.id}-${choice.name}`,
      label: choice.label,
      value: config[choice.name],
      options: choice.values.map((value) => ({
        value,
        label: choice.labels[value],
      })),
      onChoose: (value) => {
        const picked = choice.values.find((item) => item === value);
        if (picked !== undefined)
          onChange({ ...config, [choice.name]: picked });
      },
    },
    editing.context,
  );
}

export function renderDateConfig(
  property: PropertyDefinition,
  onChange: (config: unknown) => void,
  context: ConfigContext,
): TemplateResult {
  const editing = {
    property,
    config: readDateConfig(property.config),
    onChange,
    context,
  };
  const dateFormat = renderChoice(
    {
      name: "dateFormat",
      label: TEXT.dateFormat,
      values: DATE_FORMATS,
      labels: TEXT.dateFormats,
    },
    editing,
  );
  const timeFormat = renderChoice(
    {
      name: "timeFormat",
      label: TEXT.timeFormat,
      values: TIME_FORMATS,
      labels: TEXT.timeFormats,
    },
    editing,
  );
  return html`${dateFormat} ${timeFormat}`;
}
