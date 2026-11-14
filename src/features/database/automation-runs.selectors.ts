// Which automations a change sets off, as Notion's: "Page added" for each
// page new in a database, "Property edited" for each page whose value of
// that property changed. Templates are no pages of the database here.
import { DATABASE_TYPE, isPageLike } from "../../blocks/page/index.ts";
import type { Automation, DatabaseBlock } from "../../blocks/database/index.ts";
import type { Block, BlockId } from "../../model/index.ts";
import type { AppState, WebhookPayload } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";

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

// The database, the page and the automation of a run, while all are.
function partsOf(state: AppState, run: AutomationRun) {
  const database = state.workspace.blocks[run.databaseId];
  const row = state.workspace.blocks[run.rowId];
  if (database === undefined || !isDatabase(database)) return undefined;
  if (row === undefined || !isPageLike(row)) return undefined;
  const automation = database.props.automations?.find(
    (item) => item.id === run.automationId,
  );
  return automation === undefined ? undefined : { database, row, automation };
}

function nameOf(rich: readonly { readonly text: string }[]): string {
  return rich.map((span) => span.text).join("") || COPY.database.untitled;
}

// "Page added", or "<property> edited".
export function automationTrigger(
  database: DatabaseBlock,
  automation: Automation,
): string {
  const { trigger } = automation;
  if (trigger.kind === "page-added") return COPY.database.pageAdded;
  const property = database.props.properties.find(
    (item) => item.id === trigger.propertyId,
  );
  return COPY.database.propertyEdited(property?.name ?? "");
}

// What Send webhook posts for a run: the page, its title and its values by
// property name; none when the automation sends no webhook.
export function selectWebhook(
  state: AppState,
  run: AutomationRun,
): { readonly url: string; readonly payload: WebhookPayload } | undefined {
  const parts = partsOf(state, run);
  if (parts === undefined) return undefined;
  const { database, row, automation } = parts;
  const url = automation.webhookUrl;
  if (url === undefined || url === "") return undefined;
  const values: Readonly<Record<string, unknown>> = row.props.values ?? {};
  const properties = Object.fromEntries(
    database.props.properties.flatMap((property) =>
      property.id in values ? [[property.name, values[property.id]]] : [],
    ),
  );
  const title = row.props.title.map((span) => span.text).join("");
  return {
    url,
    payload: {
      source: { type: "automation", automation_id: run.automationId },
      data: { object: "page", id: row.id, title, properties },
    },
  };
}

// What Send Slack notification posts for a run: the page, its database
// and what set it off; none when the automation sends none.
export function selectSlackText(
  state: AppState,
  run: AutomationRun,
): string | undefined {
  const parts = partsOf(state, run);
  if (parts === undefined) return undefined;
  const { database, row, automation } = parts;
  if (automation.sendsSlack !== true) return undefined;
  return COPY.database.slackText(
    nameOf(row.props.title),
    nameOf(database.props.title),
    automationTrigger(database, automation),
  );
}
