CREATE TABLE `portal_webhook_log` (
	`id` integer PRIMARY KEY NOT NULL,
	`event_id` text NOT NULL,
	`received_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`result` text NOT NULL,
	`client_id` text,
	`payload` text DEFAULT '{}' NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `portal_webhook_log_event_id_unique` ON `portal_webhook_log` (`event_id`);--> statement-breakpoint
ALTER TABLE `portal_clients` ADD `client_type_confirmed` integer DEFAULT true NOT NULL;--> statement-breakpoint
ALTER TABLE `portal_clients` ADD `ghl_contact_id` text;--> statement-breakpoint
ALTER TABLE `portal_clients` ADD `ghl_location_id` text;--> statement-breakpoint
ALTER TABLE `portal_clients` ADD `ghl_opportunity_id` text;--> statement-breakpoint
ALTER TABLE `portal_clients` ADD `email` text;--> statement-breakpoint
ALTER TABLE `portal_clients` ADD `phone` text;--> statement-breakpoint
ALTER TABLE `portal_clients` ADD `product_code` text;--> statement-breakpoint
ALTER TABLE `portal_clients` ADD `source_order_id` text;--> statement-breakpoint
ALTER TABLE `portal_clients` ADD `provisioned_at` text;--> statement-breakpoint
ALTER TABLE `portal_clients` ADD `go_live_at` text;--> statement-breakpoint
ALTER TABLE `portal_clients` ADD `journey_state` text DEFAULT 'active' NOT NULL;--> statement-breakpoint
CREATE UNIQUE INDEX `portal_clients_ghl_contact_id_unique` ON `portal_clients` (`ghl_contact_id`);