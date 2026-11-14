// The settings of a formula: the formula itself, its mistake if it has
// one, and the names prop() can read.
import { html, nothing, type TemplateResult } from "lit-html";
import {
  selectDatabase,
  type PropertyDefinition,
} from "../../../../blocks/database/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import type { ConfigContext } from "../../property-definition.ts";
import { titleProperties } from "./formula-values.ts";
import { compileFormula } from "./formula.ts";
import { readFormulaConfig } from "./formula.schema.ts";

const TEXT = COPY.database;

// The prop() calls the formula can make: every property but itself.
function readableNames(
  properties: readonly PropertyDefinition[],
  property: PropertyDefinition,
): string {
  return properties
    .filter((item) => item.id !== property.id)
    .map((item) => `prop("${item.name}")`)
    .join("  ");
}

function keepFormula(
  onChange: (config: unknown) => void,
): (event: Event) => void {
  return (event) => {
    if (event.target instanceof HTMLTextAreaElement) {
      onChange({ expression: event.target.value });
    }
  };
}

// Enter keeps the formula, as Notion's editor; Shift+Enter breaks the
// line. Escape keeps it too before the settings close, as no change event
// comes from a field taken away.
function keepOnKey(
  expression: string,
  keep: (event: Event) => void,
): (event: KeyboardEvent) => void {
  return (event) => {
    const keeps =
      event.key === "Escape" || (event.key === "Enter" && !event.shiftKey);
    if (!keeps || !(event.target instanceof HTMLTextAreaElement)) return;
    if (event.key === "Enter") event.preventDefault();
    if (event.target.value !== expression) keep(event);
  };
}

export function renderFormulaConfig(
  property: PropertyDefinition,
  onChange: (config: unknown) => void,
  context: ConfigContext,
): TemplateResult {
  const { expression } = readFormulaConfig(property.config);
  const database = selectDatabase(context.state, context.databaseId);
  const properties = [
    ...titleProperties(),
    ...(database?.props.properties ?? []),
  ];
  const result =
    expression === ""
      ? undefined
      : compileFormula(expression, properties, property.id);
  const onInput = keepFormula(onChange);
  const onKey = keepOnKey(expression, onInput);
  const names = readableNames(properties, property);
  return html`<label class="database__view-name">
      ${TEXT.formula}
      <textarea
        class="database__field formula__input"
        rows="3"
        spellcheck="false"
        data-field="expression"
        aria-invalid=${String(result?.ok === false)}
        .value=${expression}
        @change=${onInput}
        @keydown=${onKey}
      ></textarea>
    </label>
    ${
      result?.ok === false
        ? html`<p class="formula__error" role="alert">${result.error}</p>`
        : nothing
    }
    <p class="formula__hint">${TEXT.formulaHint} ${names}</p>`;
}
