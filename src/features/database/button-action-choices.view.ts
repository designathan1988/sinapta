// The database an action adds a page to or edits the pages of, and, for
// Edit pages in, the condition the pages pass ("Where").
import { html, type TemplateResult } from "lit-html";
import {
  selectDatabase,
  type PropertyDefinition,
} from "../../blocks/database/index.ts";
import {
  DATABASE_TYPE,
  selectIsInTrash,
  selectPageTitle,
} from "../../blocks/page/index.ts";
import {
  parseBlockId,
  parsePropertyId,
  type FilterGroup,
} from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { renderSelect } from "../../ui/select/index.ts";
import { changeAction, type Card } from "./button-action-cards.view.ts";
import { operatorsOf } from "./filter-operators.ts";
import type { FilterOperator } from "./property-definition.ts";
import type { ButtonPropertyAction } from "./properties/button/index.ts";

const TEXT = COPY.automation;

type DatabaseAction = Extract<
  ButtonPropertyAction,
  { kind: "add-page" | "edit-pages" }
>;
type EditPages = Extract<ButtonPropertyAction, { kind: "edit-pages" }>;

function databases(state: AppState) {
  return Object.values(state.workspace.blocks).flatMap((block) => {
    if (block.type !== DATABASE_TYPE) return [];
    const database = selectDatabase(state, block.id);
    if (database === undefined || selectIsInTrash(state, database)) return [];
    const title = selectPageTitle(database);
    const label = title === "" ? COPY.sidebar.untitled : title;
    return [{ value: block.id, label, icon: "database" as const }];
  });
}

export function renderDatabaseChoice(
  card: Card,
  action: DatabaseAction,
): TemplateResult {
  return renderSelect(
    {
      id: `automation-${String(card.index)}-database`,
      label: TEXT.database,
      value: action.databaseId,
      variant: "field",
      searchPlaceholder: COPY.database.chooseDatabase,
      options: databases(card.state),
      onChoose: (databaseId) => {
        changeAction(card, { ...action, databaseId, values: {} });
      },
    },
    { overlay: card.state.ui.overlay, dispatch: card.dispatch },
  );
}

interface Rule {
  readonly propertyId: string;
  readonly operator: string;
  readonly value: string;
}

function ruleOf(action: EditPages): Rule {
  const [first] = action.filter?.items ?? [];
  if (first === undefined || "conjunction" in first) {
    return { propertyId: "", operator: "", value: "" };
  }
  const value = typeof first.value === "string" ? first.value : "";
  return { propertyId: first.propertyId, operator: first.operator, value };
}

function withRule(action: EditPages, rule: Rule): EditPages {
  const propertyId = parsePropertyId(rule.propertyId);
  if (propertyId === undefined) return action;
  const item = { propertyId, operator: rule.operator, value: rule.value };
  const filter: FilterGroup = { conjunction: "and", items: [item] };
  return { ...action, filter };
}

interface WhereParts {
  readonly card: Card;
  readonly rule: Rule;
  readonly set: (change: Partial<Rule>) => void;
}

function renderOperand(parts: WhereParts, needsOperand: boolean) {
  if (!needsOperand) return html``;
  return html`<input
    class="database__field automation__field"
    aria-label=${TEXT.value}
    .value=${parts.rule.value}
    @change=${(event: Event) => {
      if (event.target instanceof HTMLInputElement) {
        parts.set({ value: event.target.value });
      }
    }}
  />`;
}

interface WhereSelects {
  readonly card: Card;
  readonly rule: Rule;
  readonly properties: readonly PropertyDefinition[];
  readonly set: (change: Partial<Rule>) => void;
}

function renderWhereProperty(parts: WhereSelects): TemplateResult {
  const { card, rule, properties, set } = parts;
  return renderSelect(
    {
      id: `automation-${String(card.index)}-where-property`,
      label: TEXT.property,
      value: rule.propertyId === "" ? undefined : rule.propertyId,
      variant: "field",
      placeholder: TEXT.property,
      options: properties.map((each) => ({ value: each.id, label: each.name })),
      onChoose: (propertyId) => {
        const property = properties.find((each) => each.id === propertyId);
        const operator = operatorsOf(property, card.state)[0]?.id ?? "";
        set({ propertyId, operator, value: "" });
      },
    },
    { overlay: card.state.ui.overlay, dispatch: card.dispatch },
  );
}

function renderWhereOperator(
  parts: WhereSelects,
  operators: readonly FilterOperator[],
): TemplateResult {
  const { card, rule, set } = parts;
  return renderSelect(
    {
      id: `automation-${String(card.index)}-where-operator`,
      label: TEXT.operator,
      value: rule.operator === "" ? undefined : rule.operator,
      variant: "field",
      options: operators.map((each) => ({ value: each.id, label: each.label })),
      onChoose: (operator) => {
        set({ operator });
      },
    },
    { overlay: card.state.ui.overlay, dispatch: card.dispatch },
  );
}

// "Where" a property passes a condition, with its value when it asks for
// one; no condition edits every page.
export function renderWhere(card: Card, action: EditPages): TemplateResult {
  const databaseId = parseBlockId(action.databaseId) ?? null;
  const properties =
    selectDatabase(card.state, databaseId)?.props.properties ?? [];
  const rule = ruleOf(action);
  const property = properties.find((each) => each.id === rule.propertyId);
  const operators = operatorsOf(property, card.state);
  const operator = operators.find((each) => each.id === rule.operator);
  const set = (change: Partial<Rule>): void => {
    changeAction(card, withRule(action, { ...rule, ...change }));
  };
  const parts = { card, rule, properties, set };
  return html`<div class="automation__where">
    <span class="automation__property">${TEXT.where}</span>
    ${renderWhereProperty(parts)}
    ${property === undefined ? html`` : renderWhereOperator(parts, operators)}
    ${renderOperand({ card, rule, set }, operator?.needsOperand === true)}
  </div>`;
}
