// The values an action sets, as Notion's: rows of a property and the
// value it takes, a select of its options (or checked, today, a
// variable) or a field for text and numbers, each with a remove button,
// and "Add property".
import { html, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../blocks/database/index.ts";
import type { Dispatch, OpenOverlay } from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderSelect, type SelectOption } from "../../ui/select/index.ts";
import { choiceOf, firstValue, valueOfChoice } from "./button-automation.ts";

const TEXT = COPY.automation;

export interface ValuesEditor {
  readonly id: string;
  readonly values: Readonly<Record<string, unknown>>;
  readonly properties: readonly PropertyDefinition[];
  readonly variables: readonly string[];
  readonly onValues: (values: Record<string, unknown>) => void;
  readonly overlay: OpenOverlay | null;
  readonly dispatch: Dispatch;
}

const CHOOSES = new Set([
  "select",
  "status",
  "multi-select",
  "checkbox",
  "date",
]);

function choices(property: PropertyDefinition, variables: readonly string[]) {
  const own: SelectOption[] =
    property.type === "checkbox"
      ? [
          { value: "b:1", label: TEXT.checked },
          { value: "b:0", label: TEXT.unchecked },
        ]
      : property.type === "date"
        ? [{ value: "today", label: TEXT.today }]
        : (property.options ?? []).map((option) => ({
            value: `o:${option.id}`,
            label: option.name,
            color: option.color,
          }));
  return [
    ...own,
    ...variables.map((name) => ({
      value: `v:${name}`,
      label: TEXT.variable(name),
    })),
  ];
}

function renderValue(
  editor: ValuesEditor,
  property: PropertyDefinition,
): TemplateResult {
  const value = editor.values[property.id];
  const set = (next: unknown): void => {
    editor.onValues({ ...editor.values, [property.id]: next });
  };
  if (!CHOOSES.has(property.type)) {
    return html`<input
      class="database__field automation__field"
      aria-label=${TEXT.value}
      .value=${typeof value === "string" || typeof value === "number" ? String(value) : ""}
      @change=${(event: Event) => {
        if (!(event.target instanceof HTMLInputElement)) return;
        const text = event.target.value;
        set(property.type === "number" && text !== "" ? Number(text) : text);
      }}
    />`;
  }
  return renderSelect(
    {
      id: `${editor.id}-value-${property.id}`,
      label: TEXT.value,
      value: choiceOf(value),
      variant: "field",
      placeholder: TEXT.empty,
      options: choices(property, editor.variables),
      onChoose: (choice) => {
        set(valueOfChoice(choice, property.type));
      },
    },
    { overlay: editor.overlay, dispatch: editor.dispatch },
  );
}

function renderRow(
  editor: ValuesEditor,
  property: PropertyDefinition,
): TemplateResult {
  const { [property.id]: _gone, ...rest } = editor.values;
  return html`<div class="automation__value">
    <span class="automation__property">${property.name}</span>
    ${renderValue(editor, property)}
    ${renderButton({
      label: `${TEXT.removeProperty}: ${property.name}`,
      icon: "close",
      isIconOnly: true,
      onClick: () => {
        editor.onValues(rest);
      },
    })}
  </div>`;
}

export function renderValuesEditor(editor: ValuesEditor): TemplateResult {
  const set = editor.properties.filter((each) => each.id in editor.values);
  const left = editor.properties.filter(
    (each) => !(each.id in editor.values) && each.type !== "button",
  );
  return html`${set.map((property) => renderRow(editor, property))}
  ${renderSelect(
    {
      id: `${editor.id}-add`,
      label: TEXT.addProperty,
      value: undefined,
      variant: "quiet",
      placeholder: `+ ${TEXT.addProperty}`,
      options: left.map((each) => ({ value: each.id, label: each.name })),
      onChoose: (id) => {
        const property = left.find((each) => each.id === id);
        if (property === undefined) return;
        editor.onValues({ ...editor.values, [id]: firstValue(property) });
      },
    },
    { overlay: editor.overlay, dispatch: editor.dispatch },
  )}`;
}
