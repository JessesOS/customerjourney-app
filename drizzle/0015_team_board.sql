CREATE TABLE `team_boards` (
	`client_id` text PRIMARY KEY NOT NULL,
	`product_id` text NOT NULL,
	`product_version` text NOT NULL,
	`variant` text NOT NULL,
	`started_at` text NOT NULL,
	`started_by` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `team_members` (
	`id` integer PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`name` text NOT NULL,
	`roles` text DEFAULT '[]' NOT NULL,
	`is_admin` integer DEFAULT false NOT NULL,
	`active` integer DEFAULT true NOT NULL,
	`last_seen_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_members_email_unique` ON `team_members` (`email`);--> statement-breakpoint
CREATE TABLE `team_task_events` (
	`id` integer PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`task_id` integer,
	`actor_email` text NOT NULL,
	`actor_name` text NOT NULL,
	`kind` text NOT NULL,
	`from_value` text,
	`to_value` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE INDEX `team_task_events_client_idx` ON `team_task_events` (`client_id`,`created_at`);--> statement-breakpoint
CREATE INDEX `team_task_events_task_idx` ON `team_task_events` (`task_id`);--> statement-breakpoint
CREATE TABLE `team_tasks` (
	`id` integer PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`template_id` text NOT NULL,
	`product_version` text NOT NULL,
	`is_custom` integer DEFAULT false NOT NULL,
	`title` text NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`stage_id` text NOT NULL,
	`category` text DEFAULT '' NOT NULL,
	`step_id` text,
	`completes_with_steps` text DEFAULT '[]' NOT NULL,
	`role` text DEFAULT '' NOT NULL,
	`assignee_email` text,
	`status` text DEFAULT 'queued' NOT NULL,
	`blocked_reason` text DEFAULT '' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	`due_window` text DEFAULT '' NOT NULL,
	`due_day_start` integer,
	`due_day_end` integer,
	`dependencies` text DEFAULT '[]' NOT NULL,
	`loom_url` text DEFAULT '' NOT NULL,
	`sort_order` integer DEFAULT 0 NOT NULL,
	`status_changed_at` text,
	`completed_at` text,
	`completed_by` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `team_tasks_client_template_unique` ON `team_tasks` (`client_id`,`template_id`);--> statement-breakpoint
CREATE INDEX `team_tasks_assignee_idx` ON `team_tasks` (`assignee_email`);