import { describe, expect, it } from "vitest";
import { acquireWriterLock, type LockManagerLike } from "./tab-lock.ts";

// A lock manager that grants the lock, or reports it held, at once.
function locks(isHeld: boolean): LockManagerLike {
  return {
    request: (_name, _options, callback) =>
      callback(isHeld ? null : { name: "pagecraft-writer" }),
  };
}

describe("acquireWriterLock", () => {
  it("makes a tab whose lock is free the writer", async () => {
    expect(await acquireWriterLock(locks(false))).toBe("writer");
  });

  it("makes a tab whose lock is held by another tab a reader", async () => {
    expect(await acquireWriterLock(locks(true))).toBe("reader");
  });

  it("makes every tab a writer in a browser without locks", async () => {
    expect(await acquireWriterLock(undefined)).toBe("writer");
  });
});
