// The template a new row starts from, as Notion's "Set as default": one for
// all of a database's views, or a view's own, which its new rows take.
import {
  selectDatabase,
  type DatabaseBlock,
} from "../../blocks/database/index.ts";
import type { BlockId, ViewId } from "../../model/index.ts";
import { defineCommand, type AppState } from "../../state/index.ts";
import type { AddRowPayload } from "./row.commands.ts";
import {
  selectRowTemplate,
  templatesUpdate,
  viewDefaultUpdate,
} from "./template.commands.ts";

// The view of the database on screen, or its first.
function shownViewId(
  state: AppState,
  database: DatabaseBlock,
): ViewId | undefined {
  return state.ui.activeViewIds[database.id] ?? database.props.viewIds[0];
}

// The default of the view on screen: its own when it has one, else the
// database's; null for an empty page.
export function selectDefaultTemplateId(
  state: AppState,
  databaseId: BlockId,
): BlockId | null {
  const database = selectDatabase(state, databaseId);
  if (database === undefined) return null;
  const viewId = shownViewId(state, database);
  const own =
    viewId === undefined
      ? undefined
      : state.workspace.views[viewId]?.defaultTemplateId;
  return own === undefined ? database.props.defaultTemplateId : own;
}

// A new row's payload with its default template, unless it names its own.
export function withDefaultTemplate(
  state: AppState,
  payload: AddRowPayload,
): AddRowPayload {
  if (payload.template !== undefined) return payload;
  const templateId = selectDefaultTemplateId(state, payload.databaseId);
  const template =
    templateId === null ? undefined : selectRowTemplate(state, templateId);
  return template === undefined ? payload : { ...payload, template };
}

// With a view, that view's own default; without, the default for all
// views, which also replaces each view's own.
export const setDefaultTemplate = defineCommand<{
  databaseId: BlockId;
  // None: new rows start empty.
  templateId: BlockId | null;
  viewId?: ViewId;
}>({
  type: "template.setDefault",
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    const { templateId, viewId } = command;
    if (database === undefined) return {};
    const { templateIds, viewIds } = database.props;
    if (templateId !== null && !templateIds.includes(templateId)) return {};
    if (viewId !== undefined) {
      if (!viewIds.includes(viewId)) return {};
      return { operations: [viewDefaultUpdate(viewId, templateId)] };
    }
    const own = viewIds.filter(
      (id) => state.workspace.views[id]?.defaultTemplateId !== undefined,
    );
    return {
      operations: [
        templatesUpdate(database, { defaultTemplateId: templateId }),
        ...own.map((id) => viewDefaultUpdate(id, templateId)),
      ],
    };
  },
});

export const templateDefaultCommands = [setDefaultTemplate];
