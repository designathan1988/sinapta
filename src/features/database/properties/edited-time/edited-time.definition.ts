import { timestampProperty } from "../created-time/index.ts";

export const editedTimeProperty = timestampProperty(
  "edited-time",
  "Last edited time",
  "updatedAt",
);
