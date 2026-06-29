CREATE TABLE `live_dashboard_snapshot` (
	`id` integer PRIMARY KEY NOT NULL,
	`synced_at` text NOT NULL,
	`provider` text NOT NULL,
	`source_client_id` text NOT NULL,
	`last_sync_message` text DEFAULT '' NOT NULL,
	`payload` text NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
