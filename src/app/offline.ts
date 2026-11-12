// Installs the app's service worker in a built app, so that the app opens
// without a network, and offers a new version once one has installed: the
// new worker waits until the person asks for it, then takes over, and the
// page reloads into it.
import { updateReady, type AppStore, type Dispatch } from "../state/index.ts";

export interface WorkerLike extends EventTarget {
  readonly state: string;
  postMessage(message: unknown): void;
}

export interface RegistrationLike extends EventTarget {
  readonly waiting: WorkerLike | null;
  readonly installing: WorkerLike | null;
}

// The browser's side: the worker container, whether a worker already
// serves the page, and how to reload it.
export interface WorkerHost {
  readonly container: EventTarget;
  readonly hasController: () => boolean;
  readonly reload: () => void;
}

interface App {
  readonly store: AppStore;
  readonly dispatch: Dispatch;
}

const WORKER_FILE = "/service-worker.js";

// The first version takes over at once; only a later one is offered.
function offerWaiting(
  registration: RegistrationLike,
  app: App,
  host: WorkerHost,
): void {
  if (registration.waiting !== null && host.hasController()) {
    app.dispatch(updateReady.create({}));
  }
}

function handOverWhenAsked(registration: RegistrationLike, app: App): void {
  app.store.subscribe((state, previous) => {
    if (state.ui.update === "applying" && previous.ui.update !== "applying") {
      registration.waiting?.postMessage({ type: "skip-waiting" });
    }
  });
}

export function watchUpdates(
  registration: RegistrationLike,
  app: App,
  host: WorkerHost,
): void {
  offerWaiting(registration, app, host);
  registration.addEventListener("updatefound", () => {
    const worker = registration.installing;
    worker?.addEventListener("statechange", () => {
      if (worker.state === "installed") offerWaiting(registration, app, host);
    });
  });
  handOverWhenAsked(registration, app);
  let isReloading = false;
  host.container.addEventListener("controllerchange", () => {
    if (isReloading || app.store.getState().ui.update !== "applying") return;
    isReloading = true;
    host.reload();
  });
}

export function startOffline(app: App): void {
  if (!import.meta.env.PROD || !("serviceWorker" in navigator)) return;
  const { serviceWorker } = navigator;
  const host: WorkerHost = {
    container: serviceWorker,
    hasController: () => serviceWorker.controller !== null,
    reload: () => {
      location.reload();
    },
  };
  serviceWorker
    .register(WORKER_FILE)
    .then((registration) => {
      watchUpdates(registration, app, host);
    })
    .catch(() => undefined);
}
