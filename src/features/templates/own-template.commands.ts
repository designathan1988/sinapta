// Using one of "Your templates": a copy of the page saved as a template,
// at the top level, under the template's own title and not itself a
// template, opened; one step to undo.
import {
  planPageCopy,
  selectPage,
  type PageCopySize,
} from "../../blocks/page/index.ts";
import {
  listOf,
  siblingIds,
  type Block,
  type BlockId,
  type Operation,
  type View,
} from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";

function creates(
  blocks: readonly Block[],
  views: readonly View[],
): Operation[] {
  return [
    ...blocks.map((record): Operation => ({
      type: "record.create",
      kind: "block",
      record,
    })),
    ...views.map((record): Operation => ({
      type: "record.create",
      kind: "view",
      record,
    })),
  ];
}

export const useOwnTemplate = defineCommand<{ pageId: BlockId } & PageCopySize>(
  {
    type: "template.useOwn",
    newIds: (payload) => ({
      blocks: payload.blockCount,
      views: payload.viewCount,
    }),
    handle(state, command) {
      const page = selectPage(state, command.pageId);
      const plan =
        page === undefined ? undefined : planPageCopy(state, page, command);
      const root = plan?.records[0];
      if (page === undefined || plan === undefined || root === undefined) {
        return {};
      }
      const { isTemplate: _saved, ...props } = root.props;
      const top = {
        ...root,
        parentId: null,
        props: { ...props, title: page.props.title },
      };
      const records = [top, ...plan.records.slice(1)];
      const operations: Operation[] = [
        ...creates(records, plan.views),
        {
          type: "list.insert",
          list: listOf(null),
          id: top.id,
          index: siblingIds(state.workspace, null).length,
        },
      ];
      const ui = {
        ...state.ui,
        activePageId: top.id,
        overlay: null,
        peek: null,
      };
      return { operations, ui };
    },
  },
);
