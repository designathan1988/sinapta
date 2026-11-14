// A workspace's people (ADR-0013): its members with Notion's roles, the
// addresses invited before they had an account, and the workspace's name.
import type { PlanId } from "../src/model/index.ts";
import type { ApiContext } from "./api.ts";
import { inTransaction } from "./database.ts";
import * as rows from "./rows.schema.ts";

export const ROLES = ["owner", "member", "guest"] as const;
export type Role = (typeof ROLES)[number];

export function membersOf(context: ApiContext, workspaceId: string) {
  const members = context.db
    .prepare(
      "SELECT u.id, u.name, u.email, m.role FROM members m JOIN users u ON u.id = m.user_id WHERE m.workspace_id = ? ORDER BY u.name",
    )
    .all(workspaceId);
  const invites = context.db
    .prepare(
      "SELECT email, role FROM invites WHERE workspace_id = ? ORDER BY email",
    )
    .all(workspaceId);
  return {
    members: rows.readRows(rows.memberRowSchema, members),
    invites: rows.readRows(rows.inviteRowSchema, invites),
  };
}

// Adds a person with an account at once; keeps the invitation of an
// address that has none until it signs up.
export function invite(
  context: ApiContext,
  workspaceId: string,
  person: { readonly email: string; readonly role: Role },
): "added" | "invited" {
  const user = rows.readRow(
    rows.idRowSchema,
    context.db
      .prepare("SELECT id FROM users WHERE email = ?")
      .get(person.email),
  );
  if (user !== undefined) {
    context.db
      .prepare(
        "INSERT OR IGNORE INTO members (workspace_id, user_id, role) VALUES (?, ?, ?)",
      )
      .run(workspaceId, user.id, person.role);
    return "added";
  }
  context.db
    .prepare(
      "INSERT OR REPLACE INTO invites (workspace_id, email, role, created_at) VALUES (?, ?, ?, ?)",
    )
    .run(workspaceId, person.email, person.role, context.now());
  return "invited";
}

export function removeMember(
  context: ApiContext,
  workspaceId: string,
  userId: string,
): void {
  context.db
    .prepare("DELETE FROM members WHERE workspace_id = ? AND user_id = ?")
    .run(workspaceId, userId);
}

export function removeInvite(
  context: ApiContext,
  workspaceId: string,
  email: string,
): void {
  context.db
    .prepare("DELETE FROM invites WHERE workspace_id = ? AND email = ?")
    .run(workspaceId, email);
}

// A new account joins the workspaces its address was invited to.
export function acceptInvites(
  context: ApiContext,
  user: { readonly id: string; readonly email: string },
): void {
  const { db } = context;
  inTransaction(db, () => {
    db.prepare(
      "INSERT OR IGNORE INTO members (workspace_id, user_id, role) SELECT workspace_id, ?, role FROM invites WHERE email = ?",
    ).run(user.id, user.email);
    db.prepare("DELETE FROM invites WHERE email = ?").run(user.email);
  });
}

export function renameWorkspace(
  context: ApiContext,
  workspaceId: string,
  name: string,
): void {
  context.db
    .prepare("UPDATE workspaces SET name = ? WHERE id = ?")
    .run(name, workspaceId);
}

// Settings › General's icon: one emoji, or none for the name's letter.
export function setWorkspaceIcon(
  context: ApiContext,
  workspaceId: string,
  icon: string | null,
): void {
  context.db
    .prepare("UPDATE workspaces SET icon = ? WHERE id = ?")
    .run(icon, workspaceId);
}

// Settings › Plans: the plan chosen, at no cost on this server.
export function setWorkspacePlan(
  context: ApiContext,
  workspaceId: string,
  plan: PlanId,
): void {
  context.db
    .prepare("UPDATE workspaces SET plan = ? WHERE id = ?")
    .run(plan, workspaceId);
}

// "Delete entire workspace": its members, pages and log go with it.
export function deleteWorkspace(
  context: ApiContext,
  workspaceId: string,
): void {
  context.db.prepare("DELETE FROM workspaces WHERE id = ?").run(workspaceId);
}

// "Leave workspace": refused to its last owner, who would leave it to no one.
export function leaveWorkspace(
  context: ApiContext,
  workspace: { readonly id: string; readonly role: string },
  userId: string,
): boolean {
  const { db } = context;
  const owners = rows.readRow(
    rows.countRowSchema,
    db
      .prepare(
        "SELECT COUNT(*) AS count FROM members WHERE workspace_id = ? AND role = 'owner' AND user_id <> ?",
      )
      .get(workspace.id, userId),
  );
  if (workspace.role === "owner" && (owners?.count ?? 0) === 0) return false;
  db.prepare("DELETE FROM members WHERE workspace_id = ? AND user_id = ?").run(
    workspace.id,
    userId,
  );
  return true;
}
