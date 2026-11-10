// Formats one token value as CSS, by token type.
import { aliasTarget, customPropertyName, isRecord } from "./token-tree.ts";

const COLOR_SPACES = new Set(["oklch", "oklab"]);
const GENERIC_FAMILIES = new Set([
  "serif",
  "sans-serif",
  "monospace",
  "system-ui",
  "ui-serif",
  "ui-sans-serif",
  "ui-monospace",
]);

function isNumberList(value: unknown): value is number[] {
  return (
    Array.isArray(value) && value.every((item) => typeof item === "number")
  );
}

function formatColor(value: unknown): string | undefined {
  if (!isRecord(value) || typeof value.colorSpace !== "string")
    return undefined;
  if (!COLOR_SPACES.has(value.colorSpace) || !isNumberList(value.components)) {
    return undefined;
  }
  const alpha =
    typeof value.alpha === "number" ? ` / ${String(value.alpha)}` : "";
  return `${value.colorSpace}(${value.components.join(" ")}${alpha})`;
}

function formatQuantity(value: unknown): string | undefined {
  if (!isRecord(value)) return undefined;
  if (typeof value.value !== "number" || typeof value.unit !== "string") {
    return undefined;
  }
  return `${String(value.value)}${value.unit}`;
}

function formatFontFamily(value: unknown): string | undefined {
  const names = typeof value === "string" ? [value] : value;
  if (!Array.isArray(names)) return undefined;
  return names
    .filter((name) => typeof name === "string")
    .map((name) => (GENERIC_FAMILIES.has(name) ? name : `"${name}"`))
    .join(", ");
}

function formatShadowLayer(layer: unknown): string | undefined {
  if (!isRecord(layer)) return undefined;
  const parts = [layer.offsetX, layer.offsetY, layer.blur, layer.spread].map(
    formatQuantity,
  );
  const color = formatTokenValue("color", layer.color);
  if (color === undefined || parts.includes(undefined)) return undefined;
  return `${parts.join(" ")} ${color}`;
}

function formatShadow(value: unknown): string | undefined {
  const layers = (Array.isArray(value) ? value : [value]).map(
    formatShadowLayer,
  );
  return layers.includes(undefined) ? undefined : layers.join(", ");
}

const FORMATTERS: Record<string, (value: unknown) => string | undefined> = {
  color: formatColor,
  dimension: formatQuantity,
  duration: formatQuantity,
  fontFamily: formatFontFamily,
  fontWeight: (value) =>
    typeof value === "number" ? String(value) : undefined,
  number: (value) => (typeof value === "number" ? String(value) : undefined),
  cubicBezier: (value) =>
    isNumberList(value) ? `cubic-bezier(${value.join(", ")})` : undefined,
  shadow: formatShadow,
};

// Returns undefined when the value does not fit its type.
export function formatTokenValue(
  type: string,
  value: unknown,
): string | undefined {
  const target = aliasTarget(value);
  if (target !== undefined) return `var(${customPropertyName(target)})`;
  return FORMATTERS[type]?.(value);
}
