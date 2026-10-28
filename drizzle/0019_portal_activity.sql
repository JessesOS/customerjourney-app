CREATE TABLE `portal_activity` (
	`id` integer PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`kind` text NOT NULL,
	`ref` text NOT NULL,
	`person` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `portal_activity_client_idx` ON `portal_activity` (`client_id`,`created_at`);