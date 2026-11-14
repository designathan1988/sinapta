// The database's schema, one numbered step per entry, applied in order at
// start (ADR-0013). A step is never edited once committed: a change is a
// new step at the end.
export const MIGRATIONS: readonly string[] = [
  // 1: accounts, sessions and the sign-in codes Notion sends by mail.
  `CREATE TABLE users (
     id TEXT PRIMARY KEY,
     email TEXT NOT NULL UNIQUE COLLATE NOCASE,
     name TEXT NOT NULL,
     photo TEXT,
     password_hash TEXT,
     created_at INTEGER NOT NULL
   );
   CREATE TABLE sessions (
     id_hash TEXT PRIMARY KEY,
     user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     expires_at INTEGER NOT NULL
   );
   CREATE INDEX sessions_by_user ON sessions (user_id);
   CREATE TABLE login_codes (
     email TEXT PRIMARY KEY COLLATE NOCASE,
     code_hash TEXT NOT NULL,
     expires_at INTEGER NOT NULL,
     tries INTEGER NOT NULL DEFAULT 0
   );`,
  // 2: workspaces, their members, a snapshot each and the log of the
  // operations made since, in the order the server received them.
  `CREATE TABLE workspaces (
     id TEXT PRIMARY KEY,
     name TEXT NOT NULL,
     icon TEXT,
     created_at INTEGER NOT NULL
   );
   CREATE TABLE members (
     workspace_id TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
     user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     role TEXT NOT NULL,
     PRIMARY KEY (workspace_id, user_id)
   );
   CREATE INDEX members_by_user ON members (user_id);
   CREATE TABLE snapshots (
     workspace_id TEXT PRIMARY KEY REFERENCES workspaces (id) ON DELETE CASCADE,
     seq INTEGER NOT NULL,
     body TEXT NOT NULL
   );
   CREATE TABLE operations (
     workspace_id TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
     seq INTEGER NOT NULL,
     client_id TEXT NOT NULL,
     user_id TEXT NOT NULL,
     body TEXT NOT NULL,
     created_at INTEGER NOT NULL,
     PRIMARY KEY (workspace_id, seq)
   );`,
  // 3: the workspace each person opened last, opened again at sign-in.
  `ALTER TABLE users ADD COLUMN last_workspace_id TEXT;`,
  // 4: addresses invited to a workspace before they had an account.
  `CREATE TABLE invites (
     workspace_id TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
     email TEXT NOT NULL COLLATE NOCASE,
     role TEXT NOT NULL,
     created_at INTEGER NOT NULL,
     PRIMARY KEY (workspace_id, email)
   );`,
  // 5: a page's sharing: who else can open it, whether it is published,
  // and the people invited to it with their access.
  `CREATE TABLE page_access (
     workspace_id TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
     page_id TEXT NOT NULL,
     general TEXT NOT NULL DEFAULT 'workspace',
     published INTEGER NOT NULL DEFAULT 0,
     PRIMARY KEY (workspace_id, page_id)
   );
   CREATE TABLE page_shares (
     workspace_id TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
     page_id TEXT NOT NULL,
     email TEXT NOT NULL COLLATE NOCASE,
     access TEXT NOT NULL,
     PRIMARY KEY (workspace_id, page_id, email)
   );`,
  // 6: teamspaces: whether only the workspace's owners may make them, and
  // the requests to join a closed teamspace, waiting for its owners.
  `ALTER TABLE workspaces ADD COLUMN limits_teamspaces INTEGER NOT NULL DEFAULT 0;
   CREATE TABLE teamspace_requests (
     workspace_id TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
     teamspace_id TEXT NOT NULL,
     user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     created_at INTEGER NOT NULL,
     PRIMARY KEY (workspace_id, teamspace_id, user_id)
   );`,
  // 7: integrations, as Notion's internal integrations: a secret for the
  // public API, and the pages connected to each.
  `CREATE TABLE integrations (
     id TEXT PRIMARY KEY,
     workspace_id TEXT NOT NULL REFERENCES workspaces (id) ON DELETE CASCADE,
     name TEXT NOT NULL,
     secret_hash TEXT NOT NULL UNIQUE,
     created_by TEXT NOT NULL,
     created_at INTEGER NOT NULL
   );
   CREATE TABLE integration_pages (
     integration_id TEXT NOT NULL REFERENCES integrations (id) ON DELETE CASCADE,
     page_id TEXT NOT NULL,
     PRIMARY KEY (integration_id, page_id)
   );`,
  // 8: Web Push, Notion's notices on a person's other devices: the
  // server's keys, made once, and each browser's subscription.
  `CREATE TABLE push_keys (
     id INTEGER PRIMARY KEY CHECK (id = 1),
     public_key TEXT NOT NULL,
     private_key TEXT NOT NULL
   );
   CREATE TABLE push_subscriptions (
     endpoint TEXT PRIMARY KEY,
     user_id TEXT NOT NULL REFERENCES users (id) ON DELETE CASCADE,
     p256dh TEXT NOT NULL,
     auth TEXT NOT NULL,
     created_at INTEGER NOT NULL
   );`,
  // 9: a workspace's plan, as Notion's; every plan is free on this
  // server, and each keeps Notion's limits.
  `ALTER TABLE workspaces ADD COLUMN plan TEXT NOT NULL DEFAULT 'free';`,
];
