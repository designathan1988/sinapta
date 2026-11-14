// The open page's menu, in the groups Notion's has today: copy the link
// or the contents, duplicate and move; the page's versions; "Appearance
// and layout" beside it with "Suggest edits"; "Get notified"; lock and
// trash; and "More", which holds the export, the connections, Verify and
// "Save as template".
import { nothing } from "lit-html";
import {
  DATABASE_TYPE,
  PAGE_TYPE,
  setPageLocked,
  trashPage,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { AppState, Dispatch } from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuEntry, MenuItem } from "../../ui/menu/index.ts";
import { writeSystemClipboard } from "../editor/index.ts";
import { selectPageMarkdown } from "../markdown-export/index.ts";
import {
  historyItem,
  pageActionItems,
  resolvedItems,
} from "./page-menu-items.ts";
import { commentNoticeItems, commentNoticeLabel } from "../comments/index.ts";
import {
  backlinksItem,
  renderFontTiles,
  styleItems,
} from "./page-menu-style.view.ts";
import { layoutItems } from "./page-menu-layout.view.ts";
import { emailItem } from "./page-menu-email.view.ts";
import { moreItem, suggestItem } from "./page-menu-more.ts";

const TEXT = COPY.pageMenu;
const DIVIDER: MenuEntry = { kind: "divider" };

// Groups with a line between each, leaving out the empty ones.
export function grouped(groups: readonly (readonly MenuItem[])[]): MenuEntry[] {
  return groups
    .filter((group) => group.length > 0)
    .flatMap((group, index): MenuEntry[] =>
      index === 0 ? [...group] : [DIVIDER, ...group],
    );
}

// Notion's lock switch: a page's text and blocks, or a database's
// properties and views, stay as they are while it is on.
// "Get notified ›": the page's comment notices, as Notion's page menu.
function notifyItem(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): MenuItem {
  return {
    label: COPY.comments.notifyMenu,
    icon: "bell",
    value: commentNoticeLabel(state, page),
    submenu: {
      id: `notify:${page.id}`,
      menu: () => ({
        label: COPY.comments.notifySettings,
        items: commentNoticeItems(state, page, dispatch),
      }),
    },
  };
}

function lockItem(page: PageBlock, dispatch: Dispatch): MenuItem {
  const isLocked = page.props.isLocked === true;
  const pageId = page.id;
  return {
    label: page.type === DATABASE_TYPE ? TEXT.lockDatabase : TEXT.lockPage,
    icon: "lock",
    check: "switch",
    isChecked: isLocked,
    onSelect: () =>
      dispatch(setPageLocked.create({ pageId, isLocked: !isLocked })),
  };
}

// "Copy page contents": the page's text as Markdown on the clipboard.
function copyContentsItem(state: AppState, page: PageBlock): MenuItem {
  return {
    label: TEXT.copyContents,
    icon: "page",
    onSelect: () => {
      writeSystemClipboard(selectPageMarkdown(state, page.id));
      announce(TEXT.contentsCopied);
    },
  };
}

// "Appearance and layout": the font tiles, then small text, full width
// and how backlinks show, as switches and a list beside the row.
function appearanceItem(page: PageBlock, dispatch: Dispatch): MenuItem[] {
  if (page.type !== PAGE_TYPE) return [];
  const tiles = renderFontTiles(page, dispatch);
  return [
    {
      label: TEXT.appearance,
      icon: "text",
      submenu: {
        id: `appearance:${page.id}`,
        menu: () => ({
          label: TEXT.appearance,
          ...(tiles === nothing ? {} : { lead: tiles }),
          items: [
            { kind: "section", label: TEXT.appearanceSection },
            ...styleItems(page, dispatch),
            ...layoutItems(page, dispatch),
            backlinksItem(page, dispatch),
          ],
        }),
      },
    },
  ];
}

function trashItem(page: PageBlock, dispatch: Dispatch): MenuItem {
  return {
    label: TEXT.trash,
    icon: "trash",
    onSelect: () => dispatch(trashPage.create({ pageId: page.id })),
  };
}

export function pageMenuEntries(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): MenuEntry[] {
  // Copy link, duplicate and move to, without the trash, which has its
  // own place near the end.
  const [copyLink, duplicate, moveTo] = pageActionItems(
    state,
    page.id,
    dispatch,
  );
  const acts = [
    copyLink,
    copyContentsItem(state, page),
    ...emailItem(state, page),
    duplicate,
    moveTo,
  ];
  return grouped([
    acts.flatMap((item) => (item === undefined ? [] : [item])),
    [
      historyItem(page.id, dispatch),
      ...resolvedItems(state, page.id, dispatch),
    ],
    [...appearanceItem(page, dispatch), suggestItem(state, page, dispatch)],
    [notifyItem(state, page, dispatch)],
    [lockItem(page, dispatch), trashItem(page, dispatch)],
    [moreItem(state, page, dispatch)],
  ]);
}
