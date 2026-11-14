// The workspaces on the server this person belongs to, the one joined,
// and what was asked of them: Notion's workspace switcher (ADR-0013).

export interface WorkspaceSummary {
  readonly id: string;
  readonly name: string;
  readonly icon: string | null;
  readonly role: string;
  readonly members: number;
}

export type SyncRequest =
  | { readonly kind: "switch"; readonly workspaceId: string }
  | { readonly kind: "create"; readonly name: string };

export interface SyncState {
  readonly workspaces: readonly WorkspaceSummary[];
  // The workspace this client has joined; null while none is.
  readonly workspaceId: string | null;
  readonly request: SyncRequest | null;
  readonly requestCount: number;
}

export const NOT_SYNCED: SyncState = {
  workspaces: [],
  workspaceId: null,
  request: null,
  requestCount: 0,
};
