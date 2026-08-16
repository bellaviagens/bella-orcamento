CREATE TABLE `shared_itineraries` (
	`id` varchar(36) NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`token` varchar(64) NOT NULL,
	`snapshot` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `shared_itineraries_id` PRIMARY KEY(`id`),
	CONSTRAINT `shared_itineraries_token_unique` UNIQUE(`token`)
);
