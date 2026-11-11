// Views may not keep timers. Some work must still wait until the render
// that is running has finished, such as focusing an element that replaces
// one the render is about to remove, or measuring the restored selection.
// This is the one place that waiting happens.
export function afterRender(action: () => void): void {
  queueMicrotask(action);
}
