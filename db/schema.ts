import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const performanceSession = sqliteTable("performance_session", {
  id: integer("id").primaryKey(),
  currentPromptId: text("current_prompt_id"),
  status: text("status").notNull(),
  manualOutcomeId: text("manual_outcome_id"),
  reportCode: text("report_code"),
  audienceCode: text("audience_code"),
  startedAt: integer("started_at"),
  recapReleasedAt: integer("recap_released_at"),
  historyJson: text("history_json").notNull().default("[]"),
  updatedAt: integer("updated_at").notNull()
});

export const votes = sqliteTable("votes", {
  promptId: text("prompt_id").notNull(),
  audienceId: text("audience_id").notNull(),
  optionId: text("option_id").notNull()
}, (table) => [
  primaryKey({ columns: [table.promptId, table.audienceId] })
]);

export const performanceArchive = sqliteTable("performance_archive", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  startedAt: integer("started_at"),
  endedAt: integer("ended_at").notNull(),
  reportCode: text("report_code"),
  audienceCode: text("audience_code"),
  audienceDevices: integer("audience_devices").notNull().default(0),
  totalVotes: integer("total_votes").notNull(),
  historyJson: text("history_json").notNull()
});

export const displayHeartbeat = sqliteTable("display_heartbeat", {
  displayId: text("display_id").primaryKey(),
  lastSeen: integer("last_seen").notNull()
});
