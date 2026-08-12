CREATE TABLE `accounts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`code` varchar(32) NOT NULL,
	`name` varchar(160) NOT NULL,
	`type` enum('asset','liability','equity','revenue','expense') NOT NULL,
	`description` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accounts_id` PRIMARY KEY(`id`),
	CONSTRAINT `accounts_tenant_code_idx` UNIQUE(`tenantId`,`code`)
);
--> statement-breakpoint
CREATE TABLE `journal_entries` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`entryNumber` varchar(48) NOT NULL,
	`date` timestamp NOT NULL DEFAULT (now()),
	`description` text NOT NULL,
	`reference` varchar(80),
	`sourceType` varchar(48) NOT NULL DEFAULT 'manual',
	`sourceId` int,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `journal_entries_id` PRIMARY KEY(`id`),
	CONSTRAINT `journal_entries_tenant_number_idx` UNIQUE(`tenantId`,`entryNumber`)
);
--> statement-breakpoint
CREATE TABLE `journal_lines` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`journalEntryId` int NOT NULL,
	`accountId` int NOT NULL,
	`debit` decimal(12,2) NOT NULL DEFAULT '0',
	`credit` decimal(12,2) NOT NULL DEFAULT '0',
	`description` text,
	CONSTRAINT `journal_lines_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments_made` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`supplierId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`paymentMethod` varchar(32) NOT NULL,
	`reference` varchar(80),
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_made_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `payments_received` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`customerId` int NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`paymentMethod` varchar(32) NOT NULL,
	`reference` varchar(80),
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `payments_received_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `accounts_tenant_type_idx` ON `accounts` (`tenantId`,`type`);--> statement-breakpoint
CREATE INDEX `journal_entries_tenant_date_idx` ON `journal_entries` (`tenantId`,`date`);--> statement-breakpoint
CREATE INDEX `journal_entries_tenant_source_idx` ON `journal_entries` (`tenantId`,`sourceType`,`sourceId`);--> statement-breakpoint
CREATE INDEX `journal_lines_tenant_entry_idx` ON `journal_lines` (`tenantId`,`journalEntryId`);--> statement-breakpoint
CREATE INDEX `journal_lines_tenant_account_idx` ON `journal_lines` (`tenantId`,`accountId`);--> statement-breakpoint
CREATE INDEX `payments_made_tenant_supplier_idx` ON `payments_made` (`tenantId`,`supplierId`);--> statement-breakpoint
CREATE INDEX `payments_received_tenant_customer_idx` ON `payments_received` (`tenantId`,`customerId`);