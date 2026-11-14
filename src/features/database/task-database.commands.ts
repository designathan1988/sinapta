// "Turn into › Tasks database", "› Meetings" and "› Skills", as Notion's: a
// task database has someone it is for (Assignee, a person), a Status and
// a Due date; a meetings database its Attendees, a Date and a Type; a
// skills database a Description and Files.
// Turning a database into one adds whichever of these it lacks, in one
// step, and keeps the ones it has, whatever their names.
import {
  selectDatabase,
  type DatabaseBlock,
  type PropertyDefinition,
} from "../../blocks/database/index.ts";
import type { BlockId, PropertyId } from "../../model/index.ts";
import { defineCommand } from "../../state/index.ts";
import { COPY } from "../../ui/copy.ts";
import { updateProperties } from "./database.commands.ts";
import { propertyType } from "./property-registry.ts";

interface TaskProperty {
  readonly type: string;
  readonly name: string;
}

export type DatabaseKind = "tasks" | "meetings" | "skills";

const KIND_PROPERTIES: Readonly<Record<DatabaseKind, readonly TaskProperty[]>> =
  {
    tasks: [
      { type: "person", name: COPY.database.taskAssignee },
      { type: "status", name: COPY.database.taskStatus },
      { type: "date", name: COPY.database.taskDue },
    ],
    // As Notion's guide to a meeting notes database: who attended, when,
    // and what kind of meeting.
    meetings: [
      { type: "person", name: COPY.database.meetingAttendees },
      { type: "date", name: COPY.database.meetingDate },
      { type: "select", name: COPY.database.meetingType },
    ],
    // As Notion's help on skills: a skill page has a Description, which
    // says what it does and when, and Files it works from.
    skills: [
      { type: "text", name: COPY.database.skillDescription },
      { type: "files", name: COPY.database.skillFiles },
    ],
  };

// The properties of that kind of database the database lacks.
export function missingProperties(
  database: DatabaseBlock,
  kind: DatabaseKind,
): readonly TaskProperty[] {
  const types = new Set(database.props.properties.map((item) => item.type));
  return KIND_PROPERTIES[kind].filter((property) => !types.has(property.type));
}

// The task properties the database lacks.
export function missingTaskProperties(
  database: DatabaseBlock,
): readonly TaskProperty[] {
  return missingProperties(database, "tasks");
}

function idsFor(property: TaskProperty): number {
  return 1 + (propertyType(property.type).startingSettings?.optionCount ?? 0);
}

function created(
  property: TaskProperty,
  ids: readonly PropertyId[],
): PropertyDefinition | undefined {
  const [id, ...optionIds] = ids;
  if (id === undefined) return undefined;
  const starting = propertyType(property.type).startingSettings;
  return {
    id,
    name: property.name,
    type: property.type,
    ...starting?.create(optionIds),
  };
}

export const turnIntoTasks = defineCommand<{
  databaseId: BlockId;
  add: readonly TaskProperty[];
}>({
  type: "database.turnIntoTasks",
  newIds: (payload) => ({
    properties: payload.add.reduce((sum, item) => sum + idsFor(item), 0),
  }),
  handle(state, command) {
    const database = selectDatabase(state, command.databaseId);
    if (database === undefined || command.add.length === 0) return {};
    const ids = [...command.meta.propertyIds];
    const added = command.add.flatMap((property) => {
      const made = created(property, ids.splice(0, idsFor(property)));
      return made === undefined ? [] : [made];
    });
    const properties = [...database.props.properties, ...added];
    return { operations: updateProperties(database, properties) };
  },
});

export const taskDatabaseCommands = [turnIntoTasks];
