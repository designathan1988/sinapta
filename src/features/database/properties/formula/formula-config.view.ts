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
  const onInput = (event: Event): void => {
    if (event.target instanceof HTMLTextAreaElement) {
      onChange({ expression: event.target.value });
    }
  };
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
      ></textarea>
    </label>
    ${
      result?.ok === false
        ? html`<p class="formula__error" role="alert">${result.error}</p>`
        : nothing
    }
    <p class="formula__hint">${TEXT.formulaHint} ${names}</p>`;
}
