CREATE TABLE `customer_groups` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`discountPercent` decimal(5,2) NOT NULL DEFAULT '0',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customer_groups_id` PRIMARY KEY(`id`),
	CONSTRAINT `customer_groups_tenant_name_idx` UNIQUE(`tenantId`,`name`)
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `groupId` int;--> statement-breakpoint
CREATE INDEX `customers_tenant_group_idx` ON `customers` (`tenantId`,`groupId`);