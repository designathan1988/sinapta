// Choosing a row's related pages: one checkbox per row of the related
// database. Changes stay inside the editor, so a form around it that
// reads every field, as a row's page does, does not see them.
import { CHECKBOX_CLASS } from "../../../../ui/checkbox/index.ts";
import { html, type TemplateResult } from "lit-html";
import { COPY } from "../../../../ui/copy.ts";
import type { RelationChoice } from "./relation.selectors.ts";

export interface RelationEditor {
  readonly selected: readonly string[];
  readonly choices: readonly RelationChoice[];
  readonly onChange: (ids: readonly string[]) => void;
}

function toggled(editor: RelationEditor, id: string): string[] {
  return editor.selected.includes(id)
    ? editor.selected.filter((each) => each !== id)
    : [...editor.selected, id];
}

export function renderRelationEditor(editor: RelationEditor): TemplateResult {
  const onChange = (event: Event): void => {
    event.stopPropagation();
    if (!(event.target instanceof HTMLInputElement)) return;
    editor.onChange(toggled(editor, event.target.value));
  };
  if (editor.choices.length === 0) {
    return html`<p class="database__row-name">${COPY.database.noRelated}</p>`;
  }
  return html`<ul
    class="database__filters database__relation-list"
    aria-label=${COPY.database.relatedPages}
    @change=${onChange}
  >
    ${editor.choices.map(
      (choice) =>
        html`<li>
          <label class="database__check">
            <input
              type="checkbox"
              class=${CHECKBOX_CLASS}
              value=${choice.id}
              .checked=${editor.selected.includes(choice.id)}
            />
            ${choice.title === "" ? COPY.sidebar.untitled : choice.title}
          </label>
        </li>`,
    )}
  </ul>`;
}
