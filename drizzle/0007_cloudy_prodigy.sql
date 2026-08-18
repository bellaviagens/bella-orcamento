CREATE TABLE `shared_favorite_lists` (
	`id` varchar(36) NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`token` varchar(64) NOT NULL,
	`snapshot` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shared_favorite_lists_id` PRIMARY KEY(`id`),
	CONSTRAINT `shared_favorite_lists_token_unique` UNIQUE(`token`)
);
--> statement-breakpoint
ALTER TABLE `favorite_restaurants` ADD `tags` text;