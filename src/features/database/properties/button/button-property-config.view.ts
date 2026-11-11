// The settings of a button property: its label, whether a press opens the
// row, and the values a press sets: a checkbox, an option or today.
import { CHECKBOX_CLASS } from "../../../../ui/checkbox/index.ts";
import { renderConfigChoice } from "../config-choice.view.ts";
import { html, type TemplateResult } from "lit-html";
import {
  selectDatabase,
  type PropertyDefinition,
} from "../../../../blocks/database/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import type { ConfigContext } from "../../property-definition.ts";
import {
  isToday,
  readButtonPropertyConfig,
  type ButtonPropertyConfig,
} from "./button-property.schema.ts";

const TEXT = COPY.database;
const LEAVE = "";

type Choice = readonly [value: string, label: string, set: unknown];

// What a press can set a property to; none for types it cannot set.
function choicesFor(property: PropertyDefinition): readonly Choice[] {
  if (property.type === "checkbox") {
    return [
      ["true", TEXT.checked, true],
      ["false", TEXT.unchecked, undefined],
    ];
  }
  if (property.type === "date") return [["today", TEXT.today, { today: true }]];
  if (property.type === "select" || property.type === "status") {
    return (property.options ?? []).map((option) => [
      option.id,
      option.name,
      option.id,
    ]);
  }
  return [];
}

function currentChoice(set: unknown, choices: readonly Choice[]): string {
  if (isToday(set)) return "today";
  return choices.find((choice) => choice[2] === set)?.[0] ?? LEAVE;
}

function valuesOf(
  config: ButtonPropertyConfig,
): Readonly<Record<string, unknown>> {
  const action = config.actions.find((each) => each.kind === "set-values");
  return action?.kind === "set-values" ? action.values : {};
}

function withValues(
  config: ButtonPropertyConfig,
  values: Readonly<Record<string, unknown>>,
): ButtonPropertyConfig {
  const others = config.actions.filter((each) => each.kind !== "set-values");
  return {
    ...config,
    actions: [{ kind: "set-values", values: { ...values } }, ...others],
  };
}

interface Editing {
  // The button property whose settings these are.
  readonly ownerId: string;
  readonly config: ButtonPropertyConfig;
  readonly onChange: (config: unknown) => void;
  readonly context: ConfigContext;
}

function renderValueField(
  property: PropertyDefinition,
  editing: Editing,
): TemplateResult {
  const { config, onChange } = editing;
  const choices = choicesFor(property);
  const values = valuesOf(config);
  const onPick = (picked: string): void => {
    const choice = choices.find((each) => each[0] === picked);
    const { [property.id]: _old, ...rest } = values;
    onChange(
      withValues(
        config,
        choice === undefined ? rest : { ...rest, [property.id]: choice[2] },
      ),
    );
  };
  return renderConfigChoice(
    {
      id: `${editing.ownerId}-set-${property.id}`,
      label: `${TEXT.setValue} ${property.name}`,
      value: currentChoice(values[property.id], choices),
      options: [
        { value: LEAVE, label: TEXT.leaveAsIs },
        ...choices.map(([value, label]) => ({ value, label })),
      ],
      onChoose: onPick,
    },
    editing.context,
  );
}

function renderOpens(
  config: ButtonPropertyConfig,
  onChange: (config: unknown) => void,
) {
  const opens = config.actions.some((action) => action.kind === "open-page");
  const onToggle = (event: Event): void => {
    if (!(event.target instanceof HTMLInputElement)) return;
    const others = config.actions.filter((each) => each.kind !== "open-page");
    const actions = event.target.checked
      ? [...others, { kind: "open-page" as const }]
      : others;
    onChange({ ...config, actions });
  };
  return html`<label class="database__check">
    <input
      type="checkbox"
      class=${CHECKBOX_CLASS}
      .checked=${opens}
      @change=${onToggle}
    />
    ${TEXT.opensRow}
  </label>`;
}

export function renderButtonPropertyConfig(
  property: PropertyDefinition,
  onChange: (config: unknown) => void,
  context: ConfigContext,
): TemplateResult {
  const config = readButtonPropertyConfig(property.config);
  const others = (
    selectDatabase(context.state, context.databaseId)?.props.properties ?? []
  ).filter((item) => item.id !== property.id && choicesFor(item).length > 0);
  const onLabel = (event: Event): void => {
    if (event.target instanceof HTMLInputElement) {
      onChange({ ...config, label: event.target.value.trim() });
    }
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
    ${others.map((item) =>
      renderValueField(item, {
        ownerId: property.id,
        config,
        onChange,
        context,
      }),
    )}
    ${renderOpens(config, onChange)}`;
}
