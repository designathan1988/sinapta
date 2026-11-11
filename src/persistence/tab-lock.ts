// Keeps one writer per browser profile. The first tab takes a lock and
// writes; any other tab opens read-only, reloads after each of the
// writer's saves, and takes over the lock once the writer tab closes.
// Without the lock, two tabs would each save their own copy over the
// other's.

const LOCK_NAME = "pagecraft-writer";
const CHANNEL_NAME = "pagecraft";
const SAVED_MESSAGE = "saved";

export type TabRole = "writer" | "reader";

// The part of the browser's `LockManager` this module uses.
export interface LockManagerLike {
  request(
    name: string,
    options: { readonly ifAvailable?: boolean },
    callback: (lock: unknown) => Promise<unknown>,
  ): Promise<unknown>;
}

export interface TabCoordination {
  // Whether this tab may write now.
  readonly claim: () => Promise<TabRole>;
  // Resolves once this tab holds the writer lock, after the writer closes.
  readonly waitForWriter: () => Promise<void>;
  // Tells the other tabs that storage holds newer data.
  readonly announceSave: () => void;
  readonly onSaved: (listener: () => void) => void;
}

// A promise that never settles keeps a granted lock for the page's life.
function holdForever(): Promise<never> {
  return new Promise<never>(() => undefined);
}

// "writer" when this tab got the lock, "reader" when another tab holds it.
export function acquireWriterLock(
  locks: LockManagerLike | undefined,
): Promise<TabRole> {
  if (locks === undefined) return Promise.resolve("writer");
  return new Promise((resolve) => {
    void locks.request(LOCK_NAME, { ifAvailable: true }, (lock) => {
      if (lock === null) {
        resolve("reader");
        return Promise.resolve();
      }
      resolve("writer");
      return holdForever();
    });
  });
}

function waitForLock(locks: LockManagerLike | undefined): Promise<void> {
  if (locks === undefined) return holdForever();
  return new Promise((resolve) => {
    void locks.request(LOCK_NAME, {}, () => {
      resolve();
      return holdForever();
    });
  });
}

// Every tab is the writer: for browsers without locks, and for tests.
export const SOLE_TAB: TabCoordination = {
  claim: () => Promise.resolve("writer"),
  waitForWriter: holdForever,
  announceSave: () => undefined,
  onSaved: () => undefined,
};

export function createTabCoordination(): TabCoordination {
  const locks: LockManagerLike | undefined = navigator.locks;
  if (typeof BroadcastChannel === "undefined") return SOLE_TAB;
  const channel = new BroadcastChannel(CHANNEL_NAME);
  return {
    claim: () => acquireWriterLock(locks),
    waitForWriter: () => waitForLock(locks),
    announceSave: () => {
      channel.postMessage(SAVED_MESSAGE);
    },
    onSaved: (listener) => {
      channel.addEventListener("message", (event) => {
        if (event.data === SAVED_MESSAGE) listener();
      });
    },
  };
}
