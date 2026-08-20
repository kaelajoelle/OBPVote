import { integer, primaryKey, sqliteTable, text } from "drizzle-orm/sqlite-core";

export const performanceSession = sqliteTable("performance_session", {
  id: integer("id").primaryKey(),
  currentPromptId: text("current_prompt_id"),
  status: text("status").notNull(),
  manualOutcomeId: text("manual_outcome_id"),
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
  endedAt: integer("ended_at").notNull(),
  totalVotes: integer("total_votes").notNull(),
  historyJson: text("history_json").notNull()
});
