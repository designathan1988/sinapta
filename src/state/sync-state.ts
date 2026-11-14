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
import type { PageAccess } from "../model/index.ts";

export type { PageAccess };
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
  // The block they write in, when any, and where their caret is in it.
  readonly blockId: string | null;
  readonly offset?: number | null;
}

export type SyncRequest =
  | { readonly kind: "switch"; readonly workspaceId: string }
  | { readonly kind: "create"; readonly name: string }
  | { readonly kind: "rename"; readonly name: string }
  | { readonly kind: "people" }
  | { readonly kind: "shared" }
  | { readonly kind: "invite"; readonly email: string; readonly role: string }
  | { readonly kind: "remove-member"; readonly userId: string }
  | { readonly kind: "remove-invite"; readonly email: string }
  | { readonly kind: "profile"; readonly name: string }
  | {
      readonly kind: "ai-fill";
      readonly databaseId: string;
      readonly propertyId: string;
      readonly action: "summarize" | "action-items" | "translate" | "shorter";
    }
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
  // Whether this client's changes are all on the server, on their way, or
  // waiting for it to answer again.
  readonly connection: "synced" | "syncing" | "offline";
  // The pages shared with people: the sidebar lists them under Shared.
  readonly shared: readonly string[];
  // A guest's access to each page shared with them; empty for a member.
  readonly access: Readonly<Record<string, PageAccess>>;
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
  connection: "synced",
  shared: [],
  access: {},
};
