// Passwords, session tokens and sign-in codes (ADR-0013): scrypt for
// passwords, SHA-256 for the tokens and codes kept in the database, and
// constant-time comparison everywhere a secret is checked.
import {
  createHash,
  randomBytes,
  randomInt,
  scryptSync,
  timingSafeEqual,
} from "node:crypto";

const SCRYPT = { N: 2 ** 15, r: 8, p: 1, maxmem: 64 * 1024 * 1024 };
const KEY_LENGTH = 64;

function derive(password: string, salt: Buffer): Buffer {
  return scryptSync(password.normalize("NFC"), salt, KEY_LENGTH, SCRYPT);
}

export function hashPassword(password: string): string {
  const salt = randomBytes(16);
  const key = derive(password, salt);
  return `scrypt$${salt.toString("base64")}$${key.toString("base64")}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [kind, salt, key] = stored.split("$");
  if (kind !== "scrypt" || salt === undefined || key === undefined) {
    return false;
  }
  const expected = Buffer.from(key, "base64");
  const actual = derive(password, Buffer.from(salt, "base64"));
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

export function newToken(): string {
  return randomBytes(32).toString("base64url");
}

// What the database keeps of a token or a code: never the secret itself.
export function hashSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

export function sameSecret(secret: string, storedHash: string): boolean {
  const actual = Buffer.from(hashSecret(secret), "hex");
  const expected = Buffer.from(storedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}

// A sign-in code as Notion mails one: six digits.
export function newCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(6, "0");
}
