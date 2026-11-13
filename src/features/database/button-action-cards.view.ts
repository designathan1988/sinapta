// Each action of a button's automation as a card in "Do", as Notion's:
// its name, a remove button, and what it needs: the values it sets, the
// database it adds a page to or edits the pages of (and which), the
// question it asks, what it opens, or the variables it works out.
import { html, nothing, type TemplateResult } from "lit-html";
import {
  selectDatabase,
  type DatabaseBlock,
  type PropertyDefinition,
} from "../../blocks/database/index.ts";
import { parseBlockId } from "../../model/index.ts";
import {
  setOverlayDraft,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { renderButton } from "../../ui/button/index.ts";
import { COPY } from "../../ui/copy.ts";
import {
  renderDatabaseChoice,
  renderWhere,
} from "./button-action-choices.view.ts";
import { renderOpenChoice } from "./button-open-choice.view.ts";
import { variableNames, withAction } from "./button-automation.ts";
import { renderValuesEditor } from "./button-values-editor.view.ts";
import { renderVariables } from "./button-variables.view.ts";
import type {
  ButtonPropertyAction,
  ButtonPropertyConfig,
} from "./properties/button/index.ts";

const TEXT = COPY.automation;

export interface Card {
  readonly state: AppState;
  readonly dispatch: Dispatch;
  readonly draft: ButtonPropertyConfig;
  readonly index: number;
  // The database of the button's rows.
  readonly database: DatabaseBlock;
}

export function changeAction(card: Card, action: ButtonPropertyAction | null) {
  card.dispatch(
    setOverlayDraft.create({
      draft: withAction(card.draft, card.index, action),
    }),
  );
}

interface Setting {
  readonly values: Readonly<Record<string, unknown>>;
  readonly properties: readonly PropertyDefinition[];
  // The action with these values.
  readonly with: (values: Record<string, unknown>) => ButtonPropertyAction;
}

function valuesOf(card: Card, setting: Setting) {
  return renderValuesEditor({
    id: `automation-${String(card.index)}`,
    values: setting.values,
    properties: setting.properties,
    variables: variableNames(card.draft),
    overlay: card.state.ui.overlay,
    dispatch: card.dispatch,
    onValues: (values) => {
      changeAction(card, setting.with(values));
    },
  });
}

function targetProperties(card: Card, databaseId: string) {
  const target = selectDatabase(card.state, parseBlockId(databaseId) ?? null);
  return target?.props.properties ?? [];
}

type Confirm = Extract<ButtonPropertyAction, { kind: "confirm" }>;

// The question Show confirmation asks.
function renderMessage(card: Card, action: Confirm): TemplateResult {
  return html`<input
    class="database__field automation__field"
    aria-label=${TEXT.message}
    placeholder=${TEXT.messagePlaceholder}
    .value=${action.message}
    @change=${(event: Event) => {
      if (event.target instanceof HTMLInputElement) {
        changeAction(card, { ...action, message: event.target.value });
      }
    }}
  />`;
}

function renderBody(card: Card, action: ButtonPropertyAction): TemplateResult {
  switch (action.kind) {
    case "set-values":
      return valuesOf(card, {
        values: action.values,
        properties: card.database.props.properties,
        with: (values) => ({ ...action, values }),
      });
    case "add-page":
      return html`${renderDatabaseChoice(card, action)}
      ${valuesOf(card, {
        values: action.values,
        properties: targetProperties(card, action.databaseId),
        with: (values) => ({ ...action, values }),
      })}`;
    case "edit-pages":
      return html`${renderDatabaseChoice(card, action)}
      ${renderWhere(card, action)}
      ${valuesOf(card, {
        values: action.values,
        properties: targetProperties(card, action.databaseId),
        with: (values) => ({ ...action, values }),
      })}`;
    case "confirm":
      return renderMessage(card, action);
    case "open-page":
      return renderOpenChoice(card, action);
    case "define-variables":
      return renderVariables(card, action);
    default:
      return html`${nothing}`;
  }
}

export function renderActionCard(card: Card): TemplateResult {
  const action = card.draft.actions[card.index];
  if (action === undefined) return html`${nothing}`;
  return html`<section class="automation__card">
    <header class="automation__card-head">
      <span>${TEXT.actions[action.kind]}</span>
      ${renderButton({
        label: TEXT.remove,
        icon: "trash",
        isIconOnly: true,
        onClick: () => {
          changeAction(card, null);
        },
      })}
    </header>
    ${renderBody(card, action)}
  </section>`;
}
