// Typed errors produced at the two JSON boundaries.

// One stored record could not be used. The record is skipped, never repaired.
export type RecordError =
  | {
      readonly kind: "invalid-record";
      readonly recordId: string;
      readonly path: string;
    }
  | {
      readonly kind: "unknown-type";
      readonly recordId: string;
      readonly type: string;
    };

// The file as a whole could not be read.
export type WorkspaceFileError =
  | { readonly kind: "invalid-file"; readonly path: string }
  | { readonly kind: "newer-version"; readonly schemaVersion: number }
  | { readonly kind: "missing-version" };
