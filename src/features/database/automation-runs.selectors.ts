// Which automations a change sets off, as Notion's: "Page added" for each
// page new in a database, "Property edited" for each page whose value of
// that property changed. Templates are no pages of the database here.
import { DATABASE_TYPE, isPageLike } from "../../blocks/page/index.ts";
import type { Automation, DatabaseBlock } from "../../blocks/database/index.ts";
import type { Block, BlockId } from "../../model/index.ts";
import type { AppState } from "../../state/index.ts";

export interface AutomationRun {
  readonly databaseId: BlockId;
  readonly automationId: string;
  readonly rowId: BlockId;
  // How many pages it adds: one for Add page to.
  readonly adds: number;
}

function isDatabase(block: Block): block is DatabaseBlock {
  return block.type === DATABASE_TYPE;
}

function rowsOf(database: DatabaseBlock | undefined): BlockId[] {
  if (database === undefined) return [];
  const templates = new Set(database.props.templateIds);
  return database.childIds.filter((id) => !templates.has(id));
}

function valueOf(state: AppState, rowId: BlockId, propertyId: string) {
  const row = state.workspace.blocks[rowId];
  if (row === undefined || !isPageLike(row)) return undefined;
  const values: Readonly<Record<string, unknown>> = row.props.values ?? {};
  return values[propertyId];
}

function rowsSetOff(
  automation: Automation,
  states: { readonly before: AppState; readonly after: AppState },
  database: DatabaseBlock,
): BlockId[] {
  const prior = states.before.workspace.blocks[database.id];
  const earlier = new Set(
    rowsOf(prior && isDatabase(prior) ? prior : undefined),
  );
  const rows = rowsOf(database);
  const { trigger } = automation;
  if (trigger.kind === "page-added")
    return rows.filter((id) => !earlier.has(id));
  return rows.filter(
    (id) =>
      earlier.has(id) &&
      valueOf(states.before, id, trigger.propertyId) !==
        valueOf(states.after, id, trigger.propertyId),
  );
}

export function selectAutomationRuns(
  before: AppState,
  after: AppState,
): AutomationRun[] {
  return Object.values(after.workspace.blocks).flatMap((block) => {
    if (!isDatabase(block)) return [];
    return (block.props.automations ?? [])
      .filter((automation) => automation.isActive)
      .flatMap((automation) =>
        rowsSetOff(automation, { before, after }, block).map((rowId) => ({
          databaseId: block.id,
          automationId: automation.id,
          rowId,
          adds: automation.addPageTo === undefined ? 0 : 1,
        })),
      );
  });
}
