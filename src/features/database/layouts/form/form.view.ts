// A form, as Notion's: the view's name and a description above, a question
// per shown property, each marked required or not, and Submit, which adds
// a row with the answers. A required question left empty keeps the form
// from being sent and says so by its field.
import "./form.css";
import { html, nothing, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import type { PropertyId } from "../../../../model/index.ts";
import { announce } from "../../../../ui/announcer/index.ts";
import { CHECKBOX_CLASS } from "../../../../ui/checkbox/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import { renderIcon } from "../../../../ui/icon/index.ts";
import { renderSwitchMark } from "../../../../ui/switch/index.ts";
import { setFormOptions } from "../../form-options.commands.ts";
import { propertyType } from "../../property-registry.ts";
import { addRow } from "../../row.commands.ts";
import type { TableContext } from "../../table-cell.view.ts";
import { readAnswers } from "./form-answers.ts";
import { setFormErrors } from "./form.commands.ts";

const TEXT = COPY.database;

// Questions a form can ask: values a person types or chooses.
const ASKED = new Set(["text", "number", "url", "date", "toggle", "options"]);

function isAsked(property: PropertyDefinition, isTitle: boolean): boolean {
  const type = propertyType(property.type);
  return isTitle || (type.compute === undefined && ASKED.has(type.editor));
}

// A question about options: a radio each, or a box each for tags.
function renderChoices(
  property: PropertyDefinition,
  invalid: "true" | typeof nothing,
): TemplateResult {
  const multi = property.type === "multi-select";
  return html`<div class="form__choices" role="group" aria-invalid=${invalid}>
    ${(property.options ?? []).map(
      (option) =>
        html`<label class="form__choice">
          <input
            type=${multi ? "checkbox" : "radio"}
            class=${multi ? CHECKBOX_CLASS : nothing}
            name=${property.id}
            value=${option.id}
          />
          ${option.name}
        </label>`,
    )}
  </div>`;
}

// A date is typed as text, read as the date picker reads it: the
// browser's own date field would show its own language.
const INPUT_TYPES: Readonly<Partial<Record<string, string>>> = {
  toggle: "checkbox",
  date: "text",
};

const PLACEHOLDERS: Readonly<Partial<Record<string, string>>> = {
  date: COPY.database.formDate,
};

// How a question's field looks: its class, input type, keyboard and hint.
function fieldLook(type: ReturnType<typeof propertyType>) {
  return {
    className: type.editor === "toggle" ? CHECKBOX_CLASS : "form__field",
    type: INPUT_TYPES[type.editor] ?? type.input?.type ?? "text",
    mode: type.input?.mode ?? nothing,
    placeholder: PLACEHOLDERS[type.editor] ?? nothing,
  };
}

function renderControl(
  property: PropertyDefinition,
  described: { readonly id: string; readonly error?: string },
): TemplateResult {
  const type = propertyType(property.type);
  const invalid = described.error === undefined ? nothing : "true";
  if (type.editor === "options") return renderChoices(property, invalid);
  const look = fieldLook(type);
  return html`<input
    id=${described.id}
    class=${look.className}
    type=${look.type}
    inputmode=${look.mode}
    placeholder=${look.placeholder}
    name=${property.id}
    aria-invalid=${invalid}
    aria-describedby=${described.error ?? nothing}
  />`;
}

interface Question {
  readonly property: PropertyDefinition;
  readonly isTitle: boolean;
}

// Whether the form's last sending left this question unanswered.
function hasErrorFor(context: TableContext, propertyId: string): boolean {
  const errors = context.state.ui.formErrors;
  return (
    errors?.viewId === context.model.view.id &&
    errors.propertyIds.includes(propertyId)
  );
}

function toggleRequired(context: TableContext, propertyId: PropertyId): void {
  const { view } = context.model;
  const current = view.form.requiredPropertyIds;
  const requiredPropertyIds = current.includes(propertyId)
    ? current.filter((item) => item !== propertyId)
    : [...current, propertyId];
  context.dispatch(
    setFormOptions.create({
      viewId: view.id,
      options: { requiredPropertyIds },
    }),
  );
}

function renderQuestion(question: Question, context: TableContext) {
  const { property } = question;
  const { view } = context.model;
  const isRequired = view.form.requiredPropertyIds.includes(property.id);
  const id = `form-${view.id}-${property.id}`;
  const errorId = hasErrorFor(context, property.id) ? `${id}-error` : undefined;
  return html`<div class="form__question" data-name=${property.name}>
    <div class="form__question-head">
      <label class="form__label" for=${id}>
        ${renderIcon(propertyType(property.type).icon)} ${property.name}
        ${isRequired ? html`<span class="form__star" aria-hidden="true">*</span>` : nothing}
      </label>
      <button
        type="button"
        class="form__required"
        aria-pressed=${String(isRequired)}
        @click=${() => {
          toggleRequired(context, property.id);
        }}
      >
        ${TEXT.formRequired} ${renderSwitchMark(isRequired)}
      </button>
    </div>
    ${renderControl(property, { id, ...(errorId !== undefined && { error: errorId }) })}
    ${
      errorId === undefined
        ? nothing
        : html`<p class="form__error" id=${errorId}>
            ${TEXT.formRequiredError}
          </p>`
    }
  </div>`;
}

function onSubmit(
  event: Event,
  questions: readonly Question[],
  context: TableContext,
) {
  event.preventDefault();
  if (!(event.currentTarget instanceof HTMLFormElement)) return;
  const { model, dispatch } = context;
  const viewId = model.view.id;
  const titleId = questions.find((item) => item.isTitle)?.property.id ?? "";
  const answers = readAnswers(new FormData(event.currentTarget), {
    titleId,
    properties: questions
      .filter((item) => !item.isTitle)
      .map((item) => item.property),
    required: model.view.form.requiredPropertyIds,
    today: new Date().toLocaleDateString("en-CA"),
  });
  dispatch(setFormErrors.create({ viewId, propertyIds: answers.missing }));
  if (answers.missing.length > 0) return;
  const databaseId = model.database.id;
  dispatch(
    addRow.create({
      databaseId,
      title: answers.title,
      values: answers.values,
      staysPut: true,
    }),
  );
  event.currentTarget.reset();
  announce(TEXT.formSent);
}

export function renderForm(context: TableContext): TemplateResult {
  const { model, dispatch } = context;
  const questions = model.columns
    .filter((column) => isAsked(column.property, column.isTitle))
    .map((column) => ({ property: column.property, isTitle: column.isTitle }));
  const viewId = model.view.id;
  const describe = (event: Event): void => {
    if (!(event.target instanceof HTMLTextAreaElement)) return;
    const description = event.target.value;
    dispatch(setFormOptions.create({ viewId, options: { description } }));
  };
  return html`<form
    class="form"
    novalidate
    @submit=${(event: Event) => {
      onSubmit(event, questions, context);
    }}
  >
    <h2 class="form__title">${model.view.name}</h2>
    <textarea
      class="form__description"
      rows="1"
      aria-label=${TEXT.propertyDescription}
      placeholder=${TEXT.addDescription}
      .value=${model.view.form.description}
      @change=${describe}
    ></textarea>
    ${questions.map((question) => renderQuestion(question, context))}
    <button type="submit" class="form__submit">${TEXT.formSubmit}</button>
  </form>`;
}
