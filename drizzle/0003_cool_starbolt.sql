CREATE TABLE `product_variants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`productId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`sku` varchar(80) NOT NULL,
	`additionalPrice` decimal(12,2) NOT NULL DEFAULT '0',
	`stockQuantity` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `product_variants_id` PRIMARY KEY(`id`),
	CONSTRAINT `product_variants_tenant_sku_idx` UNIQUE(`tenantId`,`sku`)
);
--> statement-breakpoint
CREATE INDEX `product_variants_tenant_product_idx` ON `product_variants` (`tenantId`,`productId`);