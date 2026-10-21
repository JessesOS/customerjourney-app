CREATE TABLE `portal_acceptances` (
	`id` integer PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`step_id` text NOT NULL,
	`agreement_version` text NOT NULL,
	`agreement_hash` text NOT NULL,
	`agreement_text` text NOT NULL,
	`entity` text NOT NULL,
	`signer_name` text NOT NULL,
	`signer_email` text NOT NULL,
	`ip` text DEFAULT '' NOT NULL,
	`user_agent` text DEFAULT '' NOT NULL,
	`accepted_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `portal_acceptances_client_idx` ON `portal_acceptances` (`client_id`,`accepted_at`);