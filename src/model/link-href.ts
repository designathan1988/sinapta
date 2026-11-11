// The one place that decides which link targets and image addresses are
// allowed.
const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

// The normalized target, or undefined when it is not an allowed link.
export function safeHref(href: string): string | undefined {
  const url = URL.parse(href.trim());
  if (url === null || !ALLOWED_PROTOCOLS.has(url.protocol)) return undefined;
  return url.href;
}

const IMAGE_PROTOCOLS = new Set(["http:", "https:"]);
// Raster images only: an SVG can carry script, and a data address keeps it
// inside the workspace file, where it is shown in other browsers too.
const IMAGE_DATA =
  /^data:image\/(png|jpeg|gif|webp|avif);base64,[a-z0-9+/=]+$/i;

// The image address to show, or undefined when it is not an allowed image:
// a web address, or a raster image stored in the workspace as data.
export function safeImageSource(source: string): string | undefined {
  const trimmed = source.trim();
  if (IMAGE_DATA.test(trimmed)) return trimmed;
  const url = URL.parse(trimmed);
  if (url === null || !IMAGE_PROTOCOLS.has(url.protocol)) return undefined;
  return url.href;
}
