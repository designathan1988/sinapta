// The settings of a relation: the database its values come from, and
// whether that database shows the relation too.
import { CHECKBOX_CLASS } from "../../../../ui/checkbox/index.ts";
import { html, nothing, type TemplateResult } from "lit-html";
import type { PropertyDefinition } from "../../../../blocks/database/index.ts";
import {
  DATABASE_TYPE,
  isPageLike,
  selectIsInTrash,
  selectPageTitle,
} from "../../../../blocks/page/index.ts";
import { parseBlockId } from "../../../../model/index.ts";
import type { AppState } from "../../../../state/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import type { ConfigContext } from "../../property-definition.ts";
import { renderConfigChoice } from "../config-choice.view.ts";
import { setRelationTarget } from "./relation.commands.ts";
import { readRelationConfig } from "./relation.schema.ts";

const TEXT = COPY.database;

function databases(state: AppState): { id: string; title: string }[] {
  return Object.values(state.workspace.blocks).flatMap((block) => {
    if (block.type !== DATABASE_TYPE || !isPageLike(block)) return [];
    if (selectIsInTrash(state, block)) return [];
    const title = selectPageTitle(block);
    return [{ id: block.id, title: title === "" ? TEXT.untitled : title }];
  });
}

type Choose = (target: string, isTwoWay: boolean) => void;

function renderDatabaseChoice(
  context: ConfigContext,
  current: { readonly propertyId: string; readonly target: string },
  onPick: (target: string) => void,
): TemplateResult {
  return renderConfigChoice(
    {
      id: `${current.propertyId}-database`,
      label: TEXT.relationDatabase,
      value: current.target === "" ? undefined : current.target,
      placeholder: TEXT.chooseDatabase,
      searchPlaceholder: TEXT.chooseDatabase,
      options: databases(context.state).map((item) => ({
        value: item.id,
        label: item.title,
        icon: "database" as const,
      })),
      onChoose: onPick,
    },
    context,
  );
}

function renderTwoWay(
  current: string,
  isTwoWay: boolean,
  choose: Choose,
): TemplateResult {
  return html`<label class="database__check">
    <input
      type="checkbox"
      class=${CHECKBOX_CLASS}
      data-field="two-way"
      .checked=${isTwoWay}
      @change=${(event: Event) => {
        if (event.target instanceof HTMLInputElement)
          choose(current, event.target.checked);
      }}
    />
    ${TEXT.relationTwoWay}
  </label>`;
}

export function renderRelationConfig(
  property: PropertyDefinition,
  _onChange: (config: unknown) => void,
  context: ConfigContext,
): TemplateResult {
  const config = readRelationConfig(property.config);
  const choose: Choose = (target, isTwoWay) => {
    const targetId = parseBlockId(target);
    if (targetId === undefined) return;
    const { databaseId } = context;
    const propertyId = property.id;
    context.dispatch(
      setRelationTarget.create({ databaseId, propertyId, targetId, isTwoWay }),
    );
  };
  const current = config?.databaseId ?? "";
  const isTwoWay = config?.isTwoWay ?? true;
  const place = { propertyId: property.id, target: current };
  const database = renderDatabaseChoice(context, place, (target) => {
    choose(target, isTwoWay);
  });
  return html`${database}
  ${current === "" ? nothing : renderTwoWay(current, isTwoWay, choose)}`;
}
