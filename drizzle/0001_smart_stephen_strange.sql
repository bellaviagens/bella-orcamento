CREATE TABLE `saved_tour_proposals` (
	`id` varchar(36) NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`clientName` varchar(255) NOT NULL,
	`proposalTitle` varchar(255) NOT NULL,
	`snapshot` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_tour_proposals_id` PRIMARY KEY(`id`)
);
