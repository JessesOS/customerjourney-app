CREATE TABLE `portal_milestone_content` (
	`id` integer PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`milestone_id` text NOT NULL,
	`content` text DEFAULT '' NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
