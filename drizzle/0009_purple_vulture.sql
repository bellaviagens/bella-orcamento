CREATE TABLE `travel_library_items` (
	`id` varchar(36) NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`category` enum('hotel','tour','transfer') NOT NULL,
	`folderName` varchar(120) NOT NULL,
	`name` varchar(255) NOT NULL,
	`destination` varchar(255),
	`contactName` varchar(255),
	`phone` varchar(80),
	`linkUrl` varchar(2048),
	`imageUrl` varchar(2048),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `travel_library_items_id` PRIMARY KEY(`id`)
);
