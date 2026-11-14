// The workspace menu as Notion's (n83-workspace-menu): the workspace with
// its members, its actions, the account's address over its workspaces with
// the open one ticked and "New workspace", then Log out (ADR-0013).
import {
  openOverlay,
  requestAccount,
  requestSync,
  type AppState,
  type Dispatch,
  type WorkspaceSummary,
} from "../../state/index.ts";
import { COPY, PRODUCT_NAME, pluralize } from "../../ui/copy.ts";
import type { MenuEntry, MenuItem } from "../../ui/menu/index.ts";
import { SETTINGS_OVERLAY_KIND } from "../../ui/shortcuts/index.ts";

// The open workspace on the server, if one is.
export function selectOpenWorkspace(
  state: AppState,
): WorkspaceSummary | undefined {
  const { workspaces, workspaceId } = state.persistence.sync;
  return workspaces.find((workspace) => workspace.id === workspaceId);
}

export function selectWorkspaceName(state: AppState): string {
  return selectOpenWorkspace(state)?.name ?? PRODUCT_NAME;
}

// The workspace's mark: its emoji from Settings › General, else its
// name's first letter.
export function selectWorkspaceMark(state: AppState): string {
  const icon = selectOpenWorkspace(state)?.icon ?? null;
  return icon ?? selectWorkspaceName(state).slice(0, 1);
}

function membersOf(workspace: WorkspaceSummary): string {
  const noun = pluralize(workspace.members, COPY.account.member);
  return `${String(workspace.members)} ${noun}`;
}

function workspaceItems(state: AppState, dispatch: Dispatch): MenuEntry[] {
  const { workspaces, workspaceId } = state.persistence.sync;
  const switchTo = (id: string) => () =>
    dispatch(
      requestSync.create({ request: { kind: "switch", workspaceId: id } }),
    );
  return [
    ...workspaces.map((workspace): MenuItem => ({
      label: workspace.name,
      check: "radio",
      isChecked: workspace.id === workspaceId,
      onSelect: switchTo(workspace.id),
    })),
    {
      label: COPY.account.newWorkspace,
      icon: "plus",
      onSelect: () =>
        dispatch(
          requestSync.create({
            request: { kind: "create", name: COPY.account.newWorkspace },
          }),
        ),
    },
  ];
}

// The menu's rows: the base items alone while no one is signed in.
export function workspaceMenuEntries(
  state: AppState,
  dispatch: Dispatch,
  base: readonly MenuItem[],
): readonly MenuEntry[] {
  const { user } = state.persistence.account;
  const open = selectOpenWorkspace(state);
  if (user === null) return base;
  const head: MenuEntry[] =
    open === undefined
      ? []
      : [
          {
            label: open.name,
            description: membersOf(open),
            // As Notion's, the workspace opens its settings.
            onSelect: () =>
              dispatch(
                openOverlay.create({
                  overlay: { kind: SETTINGS_OVERLAY_KIND },
                }),
              ),
          },
          { kind: "divider" },
        ];
  return [
    ...head,
    ...base,
    { kind: "divider" },
    { kind: "section", label: user.email },
    ...workspaceItems(state, dispatch),
    { kind: "divider" },
    {
      label: COPY.account.logOut,
      onSelect: () =>
        dispatch(requestAccount.create({ request: { kind: "sign-out" } })),
    },
  ];
}
