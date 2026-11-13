CREATE TABLE `customer_ledger` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`customerId` int NOT NULL,
	`type` enum('credit_sale','payment','refund','adjustment') NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`balanceAfter` decimal(12,2) NOT NULL,
	`saleId` int,
	`method` varchar(32),
	`note` varchar(300),
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `customer_ledger_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `customers` ADD `balance` decimal(12,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
ALTER TABLE `customers` ADD `creditLimit` decimal(12,2);--> statement-breakpoint
ALTER TABLE `sales` ADD `creditAmount` decimal(12,2) DEFAULT '0' NOT NULL;--> statement-breakpoint
CREATE INDEX `ledger_customer_idx` ON `customer_ledger` (`tenantId`,`customerId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `ledger_sale_idx` ON `customer_ledger` (`tenantId`,`saleId`);