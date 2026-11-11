// Brings a stored or imported workspace file up to the current format.
import { SCHEMA_VERSION, type WorkspaceFileError } from "../../model/index.ts";
import { addTextStyles } from "./0002-text-styles.ts";
import { addViewLayouts } from "./0003-view-layouts.ts";
import { addPageCover } from "./0004-page-cover.ts";
import { addPageStyle } from "./0005-page-style.ts";
import { addBlockColor } from "./0006-block-color.ts";
import { addHeadingToggle } from "./0007-heading-toggle.ts";
import { addMentions } from "./0008-mentions.ts";
import { addCodeOptions } from "./0009-code-options.ts";
import { addDisplayOptions } from "./0010-display-options.ts";
import { addEquations } from "./0011-equations.ts";
import { moveImagesToAssets } from "./0012-assets.ts";
import { addPropertyConfig } from "./0013-property-config.ts";
import { addDateRanges } from "./0014-date-ranges.ts";
import { addLinkedViews } from "./0015-linked-views.ts";
import { addFilterGroups } from "./0016-filter-groups.ts";
import { addGroupBy } from "./0017-group-by.ts";
import { addCalculations } from "./0018-calculations.ts";
import { addTableLayout } from "./0019-table-layout.ts";

// A pure function from format version n to n + 1.
export type Migration = (
  file: Record<string, unknown>,
) => Record<string, unknown>;

// MIGRATIONS[0] turns version 1 into version 2, and so on. Each format
// change adds one file here, `0002-<what-changed>.ts`.
export const MIGRATIONS: readonly Migration[] = [
  addTextStyles,
  addViewLayouts,
  addPageCover,
  addPageStyle,
  addBlockColor,
  addHeadingToggle,
  addMentions,
  addCodeOptions,
  addDisplayOptions,
  addEquations,
  moveImagesToAssets,
  addPropertyConfig,
  addDateRanges,
  addLinkedViews,
  addFilterGroups,
  addGroupBy,
  addCalculations,
  addTableLayout,
];

export type MigrationResult =
  | { readonly ok: true; readonly file: Record<string, unknown> }
  | { readonly ok: false; readonly error: WorkspaceFileError };

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null && !Array.isArray(value);
}

export function runMigrations(
  json: unknown,
  migrations: readonly Migration[] = MIGRATIONS,
): MigrationResult {
  if (!isRecord(json)) {
    return { ok: false, error: { kind: "invalid-file", path: "" } };
  }
  const { schemaVersion } = json;
  if (typeof schemaVersion !== "number" || !Number.isInteger(schemaVersion)) {
    return { ok: false, error: { kind: "missing-version" } };
  }
  const current = migrations.length + 1;
  if (schemaVersion > current || schemaVersion < 1) {
    return { ok: false, error: { kind: "newer-version", schemaVersion } };
  }
  let file = json;
  for (const migrate of migrations.slice(schemaVersion - 1)) {
    file = { ...migrate(file), schemaVersion: Number(file.schemaVersion) + 1 };
  }
  return { ok: true, file };
}

// The app's format version is one more than the number of migrations.
export function isMigrationListComplete(): boolean {
  return MIGRATIONS.length + 1 === SCHEMA_VERSION;
}
