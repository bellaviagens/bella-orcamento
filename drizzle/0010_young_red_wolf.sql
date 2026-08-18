CREATE TABLE `travel_clients` (
	`id` varchar(36) NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`name` varchar(255) NOT NULL,
	`whatsapp` varchar(80),
	`email` varchar(320),
	`document` varchar(40),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `travel_clients_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `travel_library_items` MODIFY COLUMN `category` enum('hotel','tour','restaurant','transfer') NOT NULL;--> statement-breakpoint
ALTER TABLE `travel_library_items` ADD `responsibleName` varchar(255);--> statement-breakpoint
ALTER TABLE `travel_library_items` ADD `whatsapp` varchar(80);