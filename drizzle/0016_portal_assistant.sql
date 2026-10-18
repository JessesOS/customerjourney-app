CREATE TABLE `portal_assistant_packs` (
	`client_id` text PRIMARY KEY NOT NULL,
	`content` text NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_by` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE TABLE `portal_messages` (
	`id` integer PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`role` text NOT NULL,
	`body` text NOT NULL,
	`request_task_id` integer,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `portal_messages_client_idx` ON `portal_messages` (`client_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `portal_messages_request_idx` ON `portal_messages` (`request_task_id`);