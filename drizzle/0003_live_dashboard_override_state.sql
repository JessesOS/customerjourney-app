CREATE TABLE `live_dashboard_override_state` (
	`id` integer PRIMARY KEY NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`payload` text NOT NULL
);
