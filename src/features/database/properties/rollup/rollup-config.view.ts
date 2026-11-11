// The settings of a rollup: the relation it follows, the property of the
// related rows it reads and what it works out.
import { html, type TemplateResult } from "lit-html";
import {
  selectDatabase,
  type PropertyDefinition,
} from "../../../../blocks/database/index.ts";
import { COPY } from "../../../../ui/copy.ts";
import type { ConfigContext } from "../../property-definition.ts";
import { renderConfigChoice } from "../config-choice.view.ts";
import { readRelationConfig } from "../relation/index.ts";
import {
  readRollupConfig,
  ROLLUP_FUNCTIONS,
  type RollupConfig,
} from "./rollup.schema.ts";

const TEXT = COPY.database;

interface Choice {
  readonly field: keyof RollupConfig;
  readonly label: string;
  readonly options: readonly (readonly [value: string, label: string])[];
}

interface Editing {
  readonly property: PropertyDefinition;
  readonly config: RollupConfig;
  readonly onChange: (config: unknown) => void;
  readonly context: ConfigContext;
}

function renderChoice(choice: Choice, editing: Editing): TemplateResult {
  const { config, onChange } = editing;
  const current = config[choice.field];
  return renderConfigChoice(
    {
      id: `${editing.property.id}-${choice.field}`,
      label: choice.label,
      value: current === "" ? undefined : current,
      placeholder: choice.label,
      options: choice.options.map(([value, label]) => ({ value, label })),
      onChoose: (value) => {
        onChange({ ...config, [choice.field]: value });
      },
    },
    editing.context,
  );
}

// The properties a rollup can read: the title and the related
// database's own properties.
function targetOptions(
  context: ConfigContext,
  relation: PropertyDefinition | undefined,
): (readonly [string, string])[] {
  const targetId = readRelationConfig(relation?.config)?.databaseId;
  const target = selectDatabase(context.state, targetId ?? null);
  const properties = target?.props.properties ?? [];
  return [
    ["title", TEXT.nameColumn],
    ...properties.map((item) => [item.id, item.name] as const),
  ];
}

export function renderRollupConfig(
  property: PropertyDefinition,
  onChange: (config: unknown) => void,
  context: ConfigContext,
): TemplateResult {
  const config = readRollupConfig(property.config) ?? {
    relationPropertyId: "",
    targetPropertyId: "title",
    function: "show-original",
  };
  const database = selectDatabase(context.state, context.databaseId);
  const relations = (database?.props.properties ?? []).filter(
    (item) => item.type === "relation",
  );
  const relation = relations.find(
    (item) => item.id === config.relationPropertyId,
  );
  const choices: readonly Choice[] = [
    {
      field: "relationPropertyId",
      label: TEXT.rollupRelation,
      options: relations.map((item) => [item.id, item.name] as const),
    },
    {
      field: "targetPropertyId",
      label: TEXT.rollupProperty,
      options: targetOptions(context, relation),
    },
    {
      field: "function",
      label: TEXT.rollupFunction,
      options: ROLLUP_FUNCTIONS.map(
        (fn) => [fn, TEXT.rollupFunctions[fn]] as const,
      ),
    },
  ];
  const editing = { property, config, onChange, context };
  return html`${choices.map((choice) => renderChoice(choice, editing))}`;
}
