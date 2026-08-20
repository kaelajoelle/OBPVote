CREATE TABLE `performance_archive` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`ended_at` integer NOT NULL,
	`total_votes` integer NOT NULL,
	`history_json` text NOT NULL
);
