// Define variables, as Notion's: each a name and a formula that reads the
// row with prop(), which the values set after it can use; and "Add
// variable".
import { html, type TemplateResult } from "lit-html";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import { changeAction, type Card } from "./button-action-cards.view.ts";
import type { ButtonPropertyAction } from "./properties/button/index.ts";

const TEXT = COPY.automation;

type DefineVariables = Extract<
  ButtonPropertyAction,
  { kind: "define-variables" }
>;

interface Variable {
  readonly name: string;
  readonly expression: string;
}

function renderVariable(
  card: Card,
  action: DefineVariables,
  index: number,
): TemplateResult {
  const variable = action.variables[index] ?? { name: "", expression: "" };
  const set = (change: Partial<Variable>): void => {
    const variables = action.variables.map((each, at) =>
      at === index ? { ...each, ...change } : each,
    );
    changeAction(card, { ...action, variables });
  };
  const field = (key: keyof Variable, label: string) =>
    html`<input
      class="database__field automation__field"
      aria-label=${label}
      placeholder=${label}
      .value=${variable[key]}
      @change=${(event: Event) => {
        if (event.target instanceof HTMLInputElement) {
          set({ [key]: event.target.value });
        }
      }}
    />`;
  return html`<div class="automation__variable">
    ${field("name", TEXT.variableName)}
    ${field("expression", TEXT.variableFormula)}
  </div>`;
}

export function renderVariables(
  card: Card,
  action: DefineVariables,
): TemplateResult {
  return html`${action.variables.map((_, index) =>
    renderVariable(card, action, index),
  )}
  ${renderButton({
    label: `+ ${TEXT.addVariable}`,
    variant: "quiet",
    onClick: () => {
      const variables = [...action.variables, { name: "", expression: "" }];
      changeAction(card, { ...action, variables });
    },
  })}`;
}
