import * as v from "valibot";
import {
  blockIdSchema,
  propertyIdSchema,
  viewIdSchema,
  type BlockId,
  type PropertyId,
  type ViewId,
} from "./id.schema.ts";

// The only place ids are generated. The dispatcher calls these and passes
// the results to command handlers, which stay pure.
export function createBlockId(): BlockId {
  return v.parse(blockIdSchema, crypto.randomUUID());
}

export function createViewId(): ViewId {
  return v.parse(viewIdSchema, crypto.randomUUID());
}

export function createPropertyId(): PropertyId {
  return v.parse(propertyIdSchema, crypto.randomUUID());
}
