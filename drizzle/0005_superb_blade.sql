CREATE TABLE `saved_budget_drafts` (
	`id` varchar(36) NOT NULL,
	`ownerOpenId` varchar(64) NOT NULL,
	`label` varchar(255) NOT NULL,
	`snapshot` text NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `saved_budget_drafts_id` PRIMARY KEY(`id`)
);
