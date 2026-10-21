CREATE TABLE `portal_comms` (
	`id` integer PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`step_id` text DEFAULT '' NOT NULL,
	`kind` text DEFAULT 'message' NOT NULL,
	`author_side` text NOT NULL,
	`author_name` text DEFAULT '' NOT NULL,
	`body` text NOT NULL,
	`parent_id` integer,
	`status` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `portal_comms_client_idx` ON `portal_comms` (`client_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `portal_comms_step_idx` ON `portal_comms` (`client_id`,`step_id`);--> statement-breakpoint
CREATE TABLE `portal_comms_seen` (
	`id` integer PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`side` text NOT NULL,
	`last_seen_id` integer DEFAULT 0 NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `portal_comms_seen_client_side` ON `portal_comms_seen` (`client_id`,`side`);