ALTER TABLE `knowledge_sources` ADD `status` text DEFAULT 'indexed' NOT NULL;
ALTER TABLE `knowledge_sources` ADD `mime_type` text;
ALTER TABLE `knowledge_sources` ADD `note` text;
