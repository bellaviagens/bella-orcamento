ALTER TABLE `travel_clients` ADD `passportNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `travel_clients` ADD `passportExpiresAt` varchar(10);--> statement-breakpoint
ALTER TABLE `travel_clients` ADD `rgNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `travel_clients` ADD `rgExpiresAt` varchar(10);--> statement-breakpoint
ALTER TABLE `travel_clients` ADD `visaNumber` varchar(100);--> statement-breakpoint
ALTER TABLE `travel_clients` ADD `visaExpiresAt` varchar(10);--> statement-breakpoint
ALTER TABLE `travel_clients` ADD `documentsJson` text;