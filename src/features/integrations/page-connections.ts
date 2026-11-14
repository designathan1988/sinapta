// The page menu's "Connections", as Notion's: the workspace's integrations,
// each ticked when connected to this page, which connects or disconnects
// it (ADR-0013).
import type { BlockId } from "../../model/index.ts";
import {
  requestSync,
  type AppState,
  type Dispatch,
} from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import type { MenuEntry, MenuItem } from "../../ui/menu/index.ts";

const TEXT = COPY.integration;

function entriesOf(
  state: AppState,
  pageId: BlockId,
  dispatch: Dispatch,
): MenuEntry[] {
  const { integrations } = state.persistence.sync;
  if (integrations.length === 0) {
    return [
      { label: TEXT.menuEmpty, isDisabled: true, onSelect: () => undefined },
    ];
  }
  return integrations.map((each) => {
    const isConnected = each.pageIds.includes(pageId);
    return {
      label: each.name,
      check: "box" as const,
      isChecked: isConnected,
      keepsOpen: true,
      onSelect: () =>
        dispatch(
          requestSync.create({
            request: {
              kind: "connect-integration",
              integrationId: each.id,
              pageId,
              connected: !isConnected,
            },
          }),
        ),
    };
  });
}

// Only while signed in: integrations live on the server.
export function connectionsItem(
  state: AppState,
  pageId: BlockId,
  dispatch: Dispatch,
): MenuItem[] {
  if (state.persistence.account.user === null) return [];
  return [
    {
      label: TEXT.menu,
      icon: "link",
      submenu: {
        id: "connections",
        menu: () => ({
          label: TEXT.menu,
          items: entriesOf(state, pageId, dispatch),
        }),
      },
    },
  ];
}
