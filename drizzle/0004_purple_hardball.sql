CREATE TABLE `portal_clients` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`company_name` text DEFAULT '' NOT NULL,
	`portal_token` text NOT NULL,
	`start_date` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `portal_clients_portal_token_unique` ON `portal_clients` (`portal_token`);--> statement-breakpoint
CREATE TABLE `portal_milestone_progress` (
	`id` integer PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`milestone_id` text NOT NULL,
	`completed_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
