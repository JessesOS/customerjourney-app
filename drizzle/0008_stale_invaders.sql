CREATE TABLE `portal_milestone_uploads` (
	`id` integer PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`milestone_id` text NOT NULL,
	`file_name` text NOT NULL,
	`content` text NOT NULL,
	`uploaded_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
