// The view tab menu's rows about the database a view reads, as Notion's:
// Source › the database (a linked view can pick another); Add view to
// sidebar; Hide data source titles, for a view inside a page, where the
// database's name leads its tabs.
import { DATABASE_TYPE, isPageLike } from "../../blocks/page/index.ts";
import { selectIsInTrash, selectPageTitle } from "../../blocks/page/index.ts";
import type { BlockId } from "../../model/index.ts";
import { addSidebarView, type AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuEntry, MenuItem } from "../../ui/menu/index.ts";
import { setLinkedViewSource } from "./linked-view.commands.ts";
import { setSourceTitleHidden } from "./source-title.commands.ts";
import type { TableContext } from "./table-cell.view.ts";
import { selectLinkedProps } from "./view-holder.selectors.ts";

const TEXT = COPY.database;

// The databases a view can read: its own alone, or, for a linked view,
// every database outside the trash.
function sourceChoices(
  state: AppState,
  context: TableContext,
): readonly { id: BlockId; title: string }[] {
  const { model } = context;
  const isLinked = selectLinkedProps(state, model.holderId) !== undefined;
  const own = [
    { id: model.database.id, title: selectPageTitle(model.database) },
  ];
  if (!isLinked) return own;
  return Object.values(state.workspace.blocks).flatMap((block) =>
    block.type === DATABASE_TYPE &&
    isPageLike(block) &&
    !selectIsInTrash(state, block)
      ? [{ id: block.id, title: selectPageTitle(block) }]
      : [],
  );
}

export function sourceItem(context: TableContext): MenuItem {
  const { state, dispatch, model } = context;
  const items = sourceChoices(state, context).map((choice): MenuEntry => ({
    label: choice.title === "" ? TEXT.untitled : choice.title,
    icon: "database",
    check: "radio",
    isChecked: choice.id === model.database.id,
    onSelect: () => {
      const databaseId = choice.id;
      if (databaseId === model.database.id) return;
      dispatch(
        setLinkedViewSource.create({ blockId: model.holderId, databaseId }),
      );
    },
  }));
  const name = selectPageTitle(model.database);
  return {
    label: TEXT.viewSource,
    icon: "source",
    value: name === "" ? TEXT.untitled : name,
    submenu: {
      id: "view-tab-source",
      menu: () => ({ label: TEXT.viewSource, items }),
    },
  };
}

// Keeps the view in the sidebar, a section under the database's name.
export function sidebarItem(context: TableContext): MenuItem {
  const { model, dispatch } = context;
  return {
    label: TEXT.addViewToSidebar,
    icon: "sidebar",
    onSelect: () => dispatch(addSidebarView.create({ viewId: model.view.id })),
  };
}

export function isInsidePage(context: TableContext): boolean {
  return context.state.ui.activePageId !== context.model.holderId;
}

export function sourceTitleItem(context: TableContext): MenuItem {
  const { model, dispatch } = context;
  const isHidden = model.view.isSourceTitleHidden === true;
  return {
    label: isHidden ? TEXT.showSourceTitles : TEXT.hideSourceTitles,
    icon: isHidden ? "eye-off" : "eye",
    onSelect: () =>
      dispatch(
        setSourceTitleHidden.create({
          viewId: model.view.id,
          isHidden: !isHidden,
        }),
      ),
  };
}

// The layout panel's "Show data source title", the same setting turned
// round, as Notion's.
export function showSourceTitleItem(context: TableContext): MenuEntry[] {
  if (!isInsidePage(context)) return [];
  const { model, dispatch } = context;
  const isShown = model.view.isSourceTitleHidden !== true;
  return [
    {
      label: TEXT.showSourceTitle,
      check: "switch",
      isChecked: isShown,
      onSelect: () =>
        dispatch(
          setSourceTitleHidden.create({
            viewId: model.view.id,
            isHidden: isShown,
          }),
        ),
    },
  ];
}
