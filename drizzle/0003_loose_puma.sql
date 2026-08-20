ALTER TABLE `performance_archive` ADD `started_at` integer;--> statement-breakpoint
ALTER TABLE `performance_archive` ADD `report_code` text;--> statement-breakpoint
ALTER TABLE `performance_archive` ADD `audience_code` text;--> statement-breakpoint
ALTER TABLE `performance_archive` ADD `audience_devices` integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `performance_session` ADD `report_code` text;--> statement-breakpoint
ALTER TABLE `performance_session` ADD `audience_code` text;--> statement-breakpoint
ALTER TABLE `performance_session` ADD `started_at` integer;