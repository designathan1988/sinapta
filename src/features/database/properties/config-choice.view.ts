// One choice in a property's settings: its label, then a select that
// opens Notion's option list, the current option checked. Every type's
// settings use it, so they look and behave alike.
import { html, type TemplateResult } from "lit-html";
import { renderSelect, type SelectOption } from "../../../ui/select/index.ts";
import type { ConfigContext } from "../property-definition.ts";

export interface ConfigChoice {
  // Names the choice on the page, such as the property's id and field.
  readonly id: string;
  readonly label: string;
  readonly value: string | undefined;
  readonly options: readonly SelectOption[];
  readonly onChoose: (value: string) => void;
  readonly placeholder?: string;
  // Long lists, such as currencies, can be searched.
  readonly searchPlaceholder?: string;
}

export function renderConfigChoice(
  choice: ConfigChoice,
  context: ConfigContext,
): TemplateResult {
  const { placeholder, searchPlaceholder } = choice;
  return html`<div class="database__view-name" data-field=${choice.id}>
    <span>${choice.label}</span>
    ${renderSelect(
      {
        id: choice.id,
        label: choice.label,
        value: choice.value,
        options: choice.options,
        onChoose: choice.onChoose,
        ...(placeholder !== undefined && { placeholder }),
        ...(searchPlaceholder !== undefined && { searchPlaceholder }),
      },
      { overlay: context.state.ui.overlay, dispatch: context.dispatch },
    )}
  </div>`;
}
