import { describe, expect, it } from "vitest";
import { applyUpdate, createTestApp, uiCommands } from "../state/index.ts";
import { watchUpdates, type WorkerLike } from "./offline.ts";

class FakeWorker extends EventTarget implements WorkerLike {
  state = "installing";
  readonly sent: unknown[] = [];
  postMessage(message: unknown): void {
    this.sent.push(message);
  }
}

class FakeRegistration extends EventTarget {
  waiting: FakeWorker | null = null;
  installing: FakeWorker | null = null;
}

// The app, a registration, and whether a worker already serves the page.
function setUp(hasController: boolean) {
  const app = createTestApp({ commands: uiCommands });
  const registration = new FakeRegistration();
  const container = new EventTarget();
  let reloads = 0;
  const host = {
    container,
    hasController: () => hasController,
    reload: () => {
      reloads += 1;
    },
  };
  const start = () => {
    watchUpdates(registration, app, host);
  };
  return { app, registration, container, start, reloads: () => reloads };
}

describe("watchUpdates", () => {
  it("offers a version that waits while an older one serves the page", () => {
    const { app, registration, start } = setUp(true);
    registration.waiting = new FakeWorker();

    start();

    expect(app.store.getState().ui.update).toBe("ready");
  });

  it("offers nothing when the first version installs", () => {
    const { app, registration, start } = setUp(false);
    registration.waiting = new FakeWorker();

    start();

    expect(app.store.getState().ui.update).toBe("none");
  });

  it("offers a version once it finishes installing", () => {
    const { app, registration, start } = setUp(true);
    start();
    const worker = new FakeWorker();
    registration.installing = worker;
    registration.dispatchEvent(new Event("updatefound"));

    worker.state = "installed";
    registration.waiting = worker;
    worker.dispatchEvent(new Event("statechange"));

    expect(app.store.getState().ui.update).toBe("ready");
  });

  it("hands over when asked, and reloads once the new version serves", () => {
    const { app, registration, container, start, reloads } = setUp(true);
    const worker = new FakeWorker();
    registration.waiting = worker;
    start();

    app.dispatch(applyUpdate.create({}));
    container.dispatchEvent(new Event("controllerchange"));
    container.dispatchEvent(new Event("controllerchange"));

    expect(worker.sent).toEqual([{ type: "skip-waiting" }]);
    expect(reloads()).toBe(1);
  });

  it("does not reload when a version takes over unasked", () => {
    const { container, start, reloads } = setUp(false);
    start();

    container.dispatchEvent(new Event("controllerchange"));

    expect(reloads()).toBe(0);
  });
});
