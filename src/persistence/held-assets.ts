// The assets a workspace holds: those of blocks, such as an image, and
// those listed in a database row's values, such as a files property's.
import type { Workspace } from "../model/index.ts";

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

// The asset ids in a row's values: entries of a list with an `assetId`.
function valueAssetIds(values: unknown): string[] {
  if (!isRecord(values)) return [];
  return Object.values(values).flatMap((value) =>
    Array.isArray(value)
      ? value.flatMap((entry: unknown) =>
          isRecord(entry) && typeof entry.assetId === "string"
            ? [entry.assetId]
            : [],
        )
      : [],
  );
}

export function heldAssetIds(workspace: Workspace): Set<string> {
  return new Set(
    Object.values(workspace.blocks).flatMap((block) => {
      const { assetId, values } = block.props;
      const own = typeof assetId === "string" ? [assetId] : [];
      return [...own, ...valueAssetIds(values)];
    }),
  );
}
