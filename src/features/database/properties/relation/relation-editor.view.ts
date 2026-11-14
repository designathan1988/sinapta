// Choosing a row's related pages: one checkbox per row of the related
// database, under a search field, as Notion's, where the caller keeps
// the words. Changes stay inside the editor, so a form around it that
// reads every field, as a row's page does, does not see them.
import { CHECKBOX_CLASS } from "../../../../ui/checkbox/index.ts";
import { html, nothing, type TemplateResult } from "lit-html";
import { COPY } from "../../../../ui/copy.ts";
import type { RelationChoice } from "./relation.selectors.ts";

export interface RelationEditor {
  readonly selected: readonly string[];
  readonly choices: readonly RelationChoice[];
  readonly onChange: (ids: readonly string[]) => void;
  readonly search?: {
    readonly query: string;
    readonly onQuery: (query: string) => void;
  };
}

function titleOf(choice: RelationChoice): string {
  return choice.title === "" ? COPY.sidebar.untitled : choice.title;
}

function shownChoices(editor: RelationEditor): readonly RelationChoice[] {
  const words = editor.search?.query.trim().toLowerCase() ?? "";
  if (words === "") return editor.choices;
  return editor.choices.filter((choice) =>
    titleOf(choice).toLowerCase().includes(words),
  );
}

function renderSearch(editor: RelationEditor): TemplateResult | typeof nothing {
  const { search } = editor;
  if (search === undefined) return nothing;
  const onInput = (event: Event): void => {
    event.stopPropagation();
    if (event.target instanceof HTMLInputElement) {
      search.onQuery(event.target.value);
    }
  };
  return html`<input
    class="database__field"
    type="text"
    data-autofocus
    autocomplete="off"
    aria-label=${COPY.database.searchPages}
    placeholder=${COPY.database.searchPages}
    .value=${search.query}
    @input=${onInput}
    @change=${(event: Event) => {
      event.stopPropagation();
    }}
  />`;
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
  return html`${renderSearch(editor)}
    <ul
      class="database__filters database__relation-list"
      aria-label=${COPY.database.relatedPages}
      @change=${onChange}
    >
      ${shownChoices(editor).map(
        (choice) =>
          html`<li>
            <label class="database__check">
              <input
                type="checkbox"
                class=${CHECKBOX_CLASS}
                value=${choice.id}
                .checked=${editor.selected.includes(choice.id)}
              />
              ${titleOf(choice)}
            </label>
          </li>`,
      )}
    </ul>`;
}
