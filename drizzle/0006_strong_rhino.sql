CREATE TABLE `register_shifts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`status` enum('open','closed') NOT NULL DEFAULT 'open',
	`openedByUserId` int NOT NULL,
	`closedByUserId` int,
	`openingCash` decimal(12,2) NOT NULL DEFAULT '0',
	`expectedCash` decimal(12,2),
	`countedCash` decimal(12,2),
	`variance` decimal(12,2),
	`notes` text,
	`openedAt` timestamp NOT NULL DEFAULT (now()),
	`closedAt` timestamp,
	CONSTRAINT `register_shifts_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `shifts_tenant_status_idx` ON `register_shifts` (`tenantId`,`status`);--> statement-breakpoint
CREATE INDEX `shifts_tenant_opened_idx` ON `register_shifts` (`tenantId`,`openedAt`);