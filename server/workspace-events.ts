// The clients listening to each workspace over Server-Sent Events, and
// what is sent to them (ADR-0013).
export type Listener = (event: string, data: unknown) => void;

export interface EventHub {
  readonly listen: (workspaceId: string, listener: Listener) => () => void;
  readonly publish: (workspaceId: string, event: string, data: unknown) => void;
}

export function createEventHub(): EventHub {
  const listeners = new Map<string, Set<Listener>>();
  return {
    listen(workspaceId, listener) {
      const set = listeners.get(workspaceId) ?? new Set<Listener>();
      set.add(listener);
      listeners.set(workspaceId, set);
      return () => {
        set.delete(listener);
        if (set.size === 0) listeners.delete(workspaceId);
      };
    },
    publish(workspaceId, event, data) {
      for (const listener of listeners.get(workspaceId) ?? []) {
        listener(event, data);
      }
    },
  };
}
