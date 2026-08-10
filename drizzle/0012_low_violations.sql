CREATE TABLE `portal_form_uploads` (
	`id` integer PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`field_id` text NOT NULL,
	`file_name` text NOT NULL,
	`content_type` text DEFAULT 'application/octet-stream' NOT NULL,
	`size` integer DEFAULT 0 NOT NULL,
	`uploaded_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
