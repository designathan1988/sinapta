// With Gmail connected (Settings › Connections): "Email page" opens a
// draft in this device's mail app, the page's title as its subject and
// its text as Markdown, cut to what a mail link carries.
import { selectPageTitle, type PageBlock } from "../../blocks/page/index.ts";
import type { AppState } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuItem } from "../../ui/menu/index.ts";
import { selectPageMarkdown } from "../markdown-export/index.ts";

const TEXT = COPY.pageMenu;

const MAIL_BODY_MAX = 1800;

export function emailItem(state: AppState, page: PageBlock): MenuItem[] {
  if (!state.persistence.sync.apps.some((each) => each.app === "gmail")) {
    return [];
  }
  return [
    {
      label: TEXT.emailPage,
      icon: "compose",
      onSelect: () => {
        const subject = selectPageTitle(page) || COPY.sidebar.untitled;
        const body = selectPageMarkdown(state, page.id).slice(0, MAIL_BODY_MAX);
        const link = document.createElement("a");
        link.href = `mailto:?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
        link.click();
      },
    },
  ];
}
