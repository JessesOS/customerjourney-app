CREATE TABLE `knowledge_state` (
	`id` integer PRIMARY KEY NOT NULL,
	`synced_at` text NOT NULL,
	`sync_mode` text NOT NULL,
	`source_folder_label` text NOT NULL,
	`provider` text NOT NULL,
	`last_sync_message` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);

CREATE TABLE `knowledge_sources` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`source` text NOT NULL,
	`folder` text NOT NULL,
	`kind` text NOT NULL,
	`date` text,
	`session` integer,
	`indexed` integer DEFAULT true NOT NULL
);

CREATE TABLE `knowledge_chunks` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`title` text NOT NULL,
	`source` text NOT NULL,
	`text` text NOT NULL,
	`kind` text NOT NULL,
	`folder` text,
	`session` integer,
	`date` text,
	`aliases` text DEFAULT '[]' NOT NULL
);
