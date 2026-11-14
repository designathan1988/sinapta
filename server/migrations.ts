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
];
