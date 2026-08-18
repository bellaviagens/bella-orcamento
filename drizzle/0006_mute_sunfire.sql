CREATE TABLE `favorite_restaurants` (
	`id` varchar(36) NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`placeId` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`location` varchar(255) NOT NULL,
	`address` varchar(1000) NOT NULL,
	`description` text NOT NULL,
	`rating` varchar(16),
	`mapsUrl` varchar(2048) NOT NULL,
	`website` varchar(2048),
	`photoUrl` varchar(2048),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `favorite_restaurants_id` PRIMARY KEY(`id`)
);
