CREATE TABLE `portal_form_responses` (
	`id` integer PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`form_id` text NOT NULL,
	`responses` text DEFAULT '{}' NOT NULL,
	`completed_at` text,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
