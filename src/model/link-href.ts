// The one place that decides which link targets are allowed.
const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

// The normalized target, or undefined when it is not an allowed link.
export function safeHref(href: string): string | undefined {
  const url = URL.parse(href.trim());
  if (url === null || !ALLOWED_PROTOCOLS.has(url.protocol)) return undefined;
  return url.href;
}
