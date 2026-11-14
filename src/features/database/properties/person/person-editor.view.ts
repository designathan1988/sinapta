// Choosing a cell's people: one checkbox per person of the workspace, as
// Notion's person picker lists them.
import { html, type TemplateResult } from "lit-html";
import { CHECKBOX_CLASS } from "../../../../ui/checkbox/index.ts";
import type { PersonValue } from "./person.definition.ts";

export interface PersonEditor {
  readonly selected: readonly PersonValue[];
  readonly choices: readonly PersonValue[];
  readonly label: string;
  readonly empty: string;
  readonly onChange: (people: readonly PersonValue[]) => void;
}

function toggled(editor: PersonEditor, id: string): PersonValue[] {
  const isOn = editor.selected.some((person) => person.id === id);
  if (isOn) return editor.selected.filter((person) => person.id !== id);
  const chosen = editor.choices.find((person) => person.id === id);
  return chosen === undefined
    ? [...editor.selected]
    : [...editor.selected, chosen];
}

export function renderPersonEditor(editor: PersonEditor): TemplateResult {
  if (editor.choices.length === 0) {
    return html`<p class="database__row-name">${editor.empty}</p>`;
  }
  return html`<ul
    class="database__filters database__relation-list"
    aria-label=${editor.label}
    @change=${(event: Event) => {
      event.stopPropagation();
      if (!(event.target instanceof HTMLInputElement)) return;
      editor.onChange(toggled(editor, event.target.value));
    }}
  >
    ${editor.choices.map(
      (person) =>
        html`<li>
          <label class="database__check">
            <input
              type="checkbox"
              class=${CHECKBOX_CLASS}
              value=${person.id}
              .checked=${editor.selected.some((each) => each.id === person.id)}
            />
            ${person.name}
          </label>
        </li>`,
    )}
  </ul>`;
}
