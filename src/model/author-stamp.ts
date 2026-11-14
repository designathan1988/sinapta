// Who made and who last changed a block (ADR-0013): the dispatcher stamps
// the signed-in person on the blocks a transaction creates or changes, so
// the stamp travels with the operations and undo restores the old one.
import type { Operation } from "./operation.ts";

export interface Author {
  readonly id: string;
  readonly name: string;
}

function stampOne(operation: Operation, author: Author): Operation {
  switch (operation.type) {
    case "record.create":
      if (operation.kind !== "block") return operation;
      return {
        ...operation,
        record: { ...operation.record, createdBy: author, editedBy: author },
      };
    case "record.update":
      if (operation.kind !== "block") return operation;
      return { ...operation, patch: { ...operation.patch, editedBy: author } };
    default:
      return operation;
  }
}

export function stampAuthor(
  operations: readonly Operation[],
  author: Author,
): Operation[] {
  return operations.map((operation) => stampOne(operation, author));
}
