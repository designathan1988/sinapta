// The workspaces on the server this person belongs to, the one joined,
// and what was asked of them: Notion's workspace switcher (ADR-0013).

export interface WorkspaceSummary {
  readonly id: string;
  readonly name: string;
  readonly icon: string | null;
  readonly role: string;
  readonly members: number;
}

export interface MemberSummary {
  readonly id: string;
  readonly name: string;
  readonly email: string;
  readonly role: string;
}

export interface InviteSummary {
  readonly email: string;
  readonly role: string;
}

export type SyncRequest =
  | { readonly kind: "switch"; readonly workspaceId: string }
  | { readonly kind: "create"; readonly name: string }
  | { readonly kind: "rename"; readonly name: string }
  | { readonly kind: "people" }
  | { readonly kind: "invite"; readonly email: string; readonly role: string }
  | { readonly kind: "remove-member"; readonly userId: string }
  | { readonly kind: "remove-invite"; readonly email: string }
  | { readonly kind: "profile"; readonly name: string };

export interface SyncState {
  readonly workspaces: readonly WorkspaceSummary[];
  // The workspace this client has joined; null while none is.
  readonly workspaceId: string | null;
  readonly request: SyncRequest | null;
  readonly requestCount: number;
  // The open workspace's people, read when Settings › People opens.
  readonly members: readonly MemberSummary[];
  readonly invites: readonly InviteSummary[];
}

export const NOT_SYNCED: SyncState = {
  workspaces: [],
  workspaceId: null,
  request: null,
  requestCount: 0,
  members: [],
  invites: [],
};
