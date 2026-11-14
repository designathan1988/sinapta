// The page menu's "More", as Notion's: the page as files, the
// connections, Verify and "Save as template"; and "Suggest edits".
import {
  setPageTemplate,
  setPageVerified,
  type PageBlock,
} from "../../blocks/page/index.ts";
import type { AppState, Dispatch } from "../../state/index.ts";
import { announce } from "../../ui/announcer/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuItem } from "../../ui/menu/index.ts";
import { setSuggesting } from "../comments/index.ts";
import { connectionsItem } from "../integrations/index.ts";
import { exportItems } from "./page-menu-items.ts";

const TEXT = COPY.pageMenu;

// Notion's "Suggest edits": a switch for this page's suggesting.
export function suggestItem(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): MenuItem {
  const isOn = state.ui.suggestingPageId === page.id;
  return {
    label: COPY.suggestions.suggest,
    icon: "compose",
    check: "switch",
    isChecked: isOn,
    onSelect: () =>
      dispatch(setSuggesting.create({ pageId: isOn ? null : page.id })),
  };
}

// Notion's Verify: marks the page as verified, with no end, by the person
// signed in; once verified, the row takes the verification off.
function verifyItem(page: PageBlock, dispatch: Dispatch): MenuItem {
  const isVerified = page.props.verification !== undefined;
  const pageId = page.id;
  return {
    label: isVerified ? COPY.verify.unverify : COPY.verify.verify,
    icon: "check",
    onSelect: () =>
      dispatch(
        setPageVerified.create({ pageId, days: isVerified ? "off" : null }),
      ),
  };
}

// "Save as template": the page joins the gallery's "Your templates";
// once there, the row takes it out again.
function templateItem(page: PageBlock, dispatch: Dispatch): MenuItem {
  const isTemplate = page.props.isTemplate === true;
  return {
    label: isTemplate ? COPY.templates.unsave : COPY.templates.save,
    icon: "templates",
    onSelect: () => {
      dispatch(
        setPageTemplate.create({ pageId: page.id, isTemplate: !isTemplate }),
      );
      if (!isTemplate) announce(COPY.templates.saved);
    },
  };
}

// "More": the page as files, and as a template.
export function moreItem(
  state: AppState,
  page: PageBlock,
  dispatch: Dispatch,
): MenuItem {
  return {
    label: TEXT.more,
    icon: "more",
    submenu: {
      id: `more:${page.id}`,
      menu: () => ({
        label: TEXT.more,
        items: [
          {
            label: TEXT.export,
            icon: "download",
            submenu: {
              id: `export:${page.id}`,
              menu: () => ({
                label: TEXT.export,
                items: exportItems(state, page.id),
              }),
            },
          },
          ...connectionsItem(state, page.id, dispatch),
          verifyItem(page, dispatch),
          templateItem(page, dispatch),
        ],
      }),
    },
  };
}
