// lit-html hands an element to a `ref` callback while it may still be in a
// detached fragment, on the first render of its template. Focusing it or
// showing it in the top layer only works once it is in the document.
export function whenConnected(element: Element, action: () => void): void {
  if (element.isConnected) action();
  else queueMicrotask(action);
}
