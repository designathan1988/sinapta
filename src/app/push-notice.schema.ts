// A notice the server pushes, as the service worker reads it. The worker
// is a classic script with nothing shared with the app, so this reader
// checks the fields itself instead of using the app's schema library.
export interface PushedNotice {
  readonly title: string;
  readonly body: string;
  readonly url: string;
}

function textField(data: object, key: string): string | undefined {
  const value: unknown = Reflect.get(data, key);
  return typeof value === "string" ? value : undefined;
}

export function readPushedNotice(data: unknown): PushedNotice | undefined {
  if (typeof data !== "object" || data === null) return undefined;
  const title = textField(data, "title");
  const body = textField(data, "body");
  const url = textField(data, "url");
  if (title === undefined || body === undefined || url === undefined) {
    return undefined;
  }
  return url.startsWith("/") ? { title, body, url } : undefined;
}
