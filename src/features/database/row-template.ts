// A new row made from a template: a copy of the template's page and its
// blocks, with the values the row was added with over the template's.
import { selectDatabase } from "../../blocks/database/index.ts";
import { selectPage, type PageBlock } from "../../blocks/page/index.ts";
import { copyBlockTree, type Block } from "../../model/index.ts";
import type { AppState, CommandMeta } from "../../state/index.ts";
import type { AddRowPayload } from "./row.commands.ts";

// The template a new row starts from, while it is one of its database.
function templateOf(state: AppState, command: AddRowPayload) {
  const { template } = command;
  const page = selectPage(state, template?.id ?? null);
  const database = selectDatabase(state, command.databaseId);
  if (template === undefined || page === undefined) return undefined;
  const isTemplate = database?.props.templateIds.includes(page.id) === true;
  return isTemplate ? { page, blockCount: template.blockCount } : undefined;
}

// The new row's page: the template's, with the row's own title when it
// has one, and its values over the template's.
function rowProps(
  page: PageBlock,
  command: AddRowPayload,
  values: Readonly<Record<string, unknown>>,
): PageBlock["props"] {
  const title = command.title?.trim().normalize("NFC") ?? "";
  return {
    ...page.props,
    ...(title !== "" && { title: [{ text: title }] }),
    isFavorite: false,
    isTrashed: false,
    values: { ...page.props.values, ...values },
  };
}

// The records of the new row, its page first; undefined when the row is
// not made from a template or the template is gone.
export function fromTemplate(
  state: AppState,
  command: AddRowPayload & { readonly meta: CommandMeta },
  values: Readonly<Record<string, unknown>>,
): Block[] | undefined {
  const template = templateOf(state, command);
  if (template === undefined) return undefined;
  const { blockIds, now } = command.meta;
  const rootId = template.page.id;
  const copies = copyBlockTree(state.workspace, { rootId, ids: blockIds, now });
  const [root, ...blocks] = copies ?? [];
  if (root === undefined || copies?.length !== template.blockCount) {
    return undefined;
  }
  const props = rowProps(template.page, command, values);
  return [{ ...root, props }, ...blocks];
}
