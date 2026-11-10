import * as v from "valibot";

export const blockIdSchema = v.pipe(v.string(), v.brand("BlockId"));
export const viewIdSchema = v.pipe(v.string(), v.brand("ViewId"));
export const propertyIdSchema = v.pipe(v.string(), v.brand("PropertyId"));

export type BlockId = v.InferOutput<typeof blockIdSchema>;
export type ViewId = v.InferOutput<typeof viewIdSchema>;
export type PropertyId = v.InferOutput<typeof propertyIdSchema>;
