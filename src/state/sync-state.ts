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

// Notion's access levels on a page, and who else can open it.
export type PageAccess = "full" | "edit" | "comment" | "view";
export type GeneralAccess = "invited" | "workspace" | "web";

export interface PageSharing {
  readonly pageId: string;
  readonly general: GeneralAccess;
  readonly published: boolean;
  readonly people: readonly {
    readonly email: string;
    readonly name: string | null;
    readonly access: PageAccess;
  }[];
}

// Someone with the workspace open, and the page they are on.
export interface Presence {
  readonly userId: string;
  readonly name: string;
  readonly pageId: string | null;
}

export type SyncRequest =
  | { readonly kind: "switch"; readonly workspaceId: string }
  | { readonly kind: "create"; readonly name: string }
  | { readonly kind: "rename"; readonly name: string }
  | { readonly kind: "people" }
  | { readonly kind: "invite"; readonly email: string; readonly role: string }
  | { readonly kind: "remove-member"; readonly userId: string }
  | { readonly kind: "remove-invite"; readonly email: string }
  | { readonly kind: "profile"; readonly name: string }
  | { readonly kind: "sharing"; readonly pageId: string }
  | {
      readonly kind: "share";
      readonly pageId: string;
      readonly email: string;
      readonly access: PageAccess;
    }
  | {
      readonly kind: "unshare";
      readonly pageId: string;
      readonly email: string;
    }
  | {
      readonly kind: "general";
      readonly pageId: string;
      readonly general: GeneralAccess;
    }
  | {
      readonly kind: "publish";
      readonly pageId: string;
      readonly published: boolean;
    };

export interface SyncState {
  readonly workspaces: readonly WorkspaceSummary[];
  // The workspace this client has joined; null while none is.
  readonly workspaceId: string | null;
  readonly request: SyncRequest | null;
  readonly requestCount: number;
  // The open workspace's people, read when Settings › People opens.
  readonly members: readonly MemberSummary[];
  readonly invites: readonly InviteSummary[];
  // The sharing of the page whose Share menu is open, once read.
  readonly sharing: PageSharing | null;
  // Everyone with the workspace open now, this person included.
  readonly presence: readonly Presence[];
}

export const NOT_SYNCED: SyncState = {
  workspaces: [],
  workspaceId: null,
  request: null,
  requestCount: 0,
  members: [],
  invites: [],
  sharing: null,
  presence: [],
};
