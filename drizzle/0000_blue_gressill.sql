CREATE TABLE `performance_session` (
	`id` integer PRIMARY KEY NOT NULL,
	`current_prompt_id` text,
	`status` text NOT NULL,
	`manual_outcome_id` text,
	`history_json` text DEFAULT '[]' NOT NULL,
	`updated_at` integer NOT NULL
);
--> statement-breakpoint
CREATE TABLE `votes` (
	`prompt_id` text NOT NULL,
	`audience_id` text NOT NULL,
	`option_id` text NOT NULL,
	PRIMARY KEY(`prompt_id`, `audience_id`)
);
