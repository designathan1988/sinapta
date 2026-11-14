// The workspaces on the server this person belongs to, the one joined,
// and what was asked of them: Notion's workspace switcher (ADR-0013).
import type { BillingState, CardInput } from "./billing.commands.ts";
import type { PageAccess, PlanId } from "../model/index.ts";

export interface WorkspaceSummary {
  readonly id: string;
  readonly name: string;
  readonly icon: string | null;
  readonly role: string;
  readonly members: number;
  // 1 when only the workspace's owners may make teamspaces.
  readonly limitsTeamspaces?: number;
  readonly plan?: PlanId;
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

// A teamspace as the server lists it in Settings: those this person is
// not in come only from here, as a closed one they may ask to join.
export interface ListedTeamspace {
  readonly id: string;
  readonly name: string;
  readonly access: string;
  readonly owner: string;
  readonly isMember: boolean;
  readonly hasAsked: boolean;
  readonly isArchived: boolean;
  readonly hasOverrides: boolean;
  // Who asks to join, shown to its owners.
  readonly requests: readonly {
    readonly userId: string;
    readonly name: string;
  }[];
}

// An integration, as Settings › Connections lists it, with the pages
// connected to it.
export interface IntegrationSummary {
  readonly id: string;
  readonly name: string;
  readonly pageIds: readonly string[];
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
  | { readonly kind: "plan"; readonly plan: PlanId }
  | { readonly kind: "billing" }
  | { readonly kind: "add-card"; readonly card: CardInput }
  | { readonly kind: "remove-card" }
  | { readonly kind: "checkout" }
  | { readonly kind: "workspace-icon"; readonly icon: string | null }
  | { readonly kind: "delete-workspace"; readonly name: string }
  | { readonly kind: "leave-workspace" }
  | { readonly kind: "people" }
  | { readonly kind: "shared" }
  | { readonly kind: "teamspaces" }
  | { readonly kind: "join-teamspace"; readonly teamspaceId: string }
  | {
      readonly kind: "approve-teamspace";
      readonly teamspaceId: string;
      readonly userId: string;
    }
  | { readonly kind: "teamspace-limit"; readonly limited: boolean }
  | { readonly kind: "integrations" }
  | { readonly kind: "create-integration"; readonly name: string }
  | { readonly kind: "remove-integration"; readonly integrationId: string }
  | {
      readonly kind: "connect-app";
      readonly app: string;
      readonly address?: string;
    }
  | { readonly kind: "disconnect-app"; readonly app: string }
  | {
      readonly kind: "connect-integration";
      readonly integrationId: string;
      readonly pageId: string;
      readonly connected: boolean;
    }
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
  // The teamspaces the server lists in Settings › Teamspaces.
  readonly teamspaces: readonly ListedTeamspace[];
  // The workspace's integrations, and the secret of the one just made,
  // shown once.
  readonly integrations: readonly IntegrationSummary[];
  readonly newSecret: { readonly name: string; readonly secret: string } | null;
  // The apps connected (Settings › Connections), and the coming events of
  // the connected calendars, for Home.
  readonly apps: readonly ConnectedApp[];
  readonly calendarEvents: readonly CalendarEventSummary[];
  // Settings › Billing, once read; null before.
  readonly billing: BillingState | null;
}

export interface ConnectedApp {
  readonly app: string;
  // The host of the address it reaches, as a webhook's own is secret.
  readonly host: string | null;
}

export interface CalendarEventSummary {
  readonly title: string;
  readonly date: string;
  readonly time: string | null;
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
  teamspaces: [],
  integrations: [],
  newSecret: null,
  apps: [],
  calendarEvents: [],
  billing: null,
};
