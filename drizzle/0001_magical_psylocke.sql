CREATE TABLE `audit_logs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int,
	`userId` int NOT NULL,
	`action` varchar(100) NOT NULL,
	`entity` varchar(100) NOT NULL,
	`entityId` int,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `audit_logs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `categories` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(120) NOT NULL,
	`color` varchar(16) NOT NULL DEFAULT '#5B6CFF',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `categories_id` PRIMARY KEY(`id`),
	CONSTRAINT `categories_tenant_name_idx` UNIQUE(`tenantId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`email` varchar(320),
	`phone` varchar(40),
	`loyaltyPoints` int NOT NULL DEFAULT 0,
	`totalSpent` decimal(12,2) NOT NULL DEFAULT '0',
	`lastPurchaseAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `expenses` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`category` varchar(100) NOT NULL,
	`amount` decimal(12,2) NOT NULL,
	`notes` text,
	`expenseDate` timestamp NOT NULL DEFAULT (now()),
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `expenses_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `inventory_movements` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`productId` int NOT NULL,
	`type` enum('stock_in','stock_out','adjustment','sale','purchase') NOT NULL,
	`quantity` int NOT NULL,
	`reason` varchar(220),
	`referenceId` int,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `inventory_movements_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`categoryId` int,
	`name` varchar(180) NOT NULL,
	`sku` varchar(80) NOT NULL,
	`barcode` varchar(80),
	`description` text,
	`costPrice` decimal(12,2) NOT NULL DEFAULT '0',
	`sellingPrice` decimal(12,2) NOT NULL DEFAULT '0',
	`discountPrice` decimal(12,2),
	`taxRate` decimal(6,3),
	`stockQuantity` int NOT NULL DEFAULT 0,
	`minStockLevel` int NOT NULL DEFAULT 5,
	`unit` varchar(32) NOT NULL DEFAULT 'each',
	`imageUrl` text,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_tenant_sku_idx` UNIQUE(`tenantId`,`sku`)
);
--> statement-breakpoint
CREATE TABLE `purchase_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`purchaseId` int NOT NULL,
	`productId` int NOT NULL,
	`quantity` int NOT NULL,
	`unitCost` decimal(12,2) NOT NULL,
	`lineTotal` decimal(12,2) NOT NULL,
	CONSTRAINT `purchase_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `purchases` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`supplierId` int,
	`purchaseNumber` varchar(48) NOT NULL,
	`status` enum('draft','ordered','received','cancelled') NOT NULL DEFAULT 'draft',
	`total` decimal(12,2) NOT NULL DEFAULT '0',
	`notes` text,
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `purchases_id` PRIMARY KEY(`id`),
	CONSTRAINT `purchases_tenant_number_idx` UNIQUE(`tenantId`,`purchaseNumber`)
);
--> statement-breakpoint
CREATE TABLE `sale_items` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`saleId` int NOT NULL,
	`productId` int NOT NULL,
	`productName` varchar(180) NOT NULL,
	`sku` varchar(80) NOT NULL,
	`quantity` int NOT NULL,
	`unitPrice` decimal(12,2) NOT NULL,
	`lineTotal` decimal(12,2) NOT NULL,
	CONSTRAINT `sale_items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `sales` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`customerId` int,
	`saleNumber` varchar(48) NOT NULL,
	`status` enum('completed','held','cancelled','refunded') NOT NULL DEFAULT 'completed',
	`subtotal` decimal(12,2) NOT NULL,
	`discount` decimal(12,2) NOT NULL DEFAULT '0',
	`tax` decimal(12,2) NOT NULL DEFAULT '0',
	`total` decimal(12,2) NOT NULL,
	`paymentMethod` varchar(32) NOT NULL,
	`amountReceived` decimal(12,2) NOT NULL DEFAULT '0',
	`changeAmount` decimal(12,2) NOT NULL DEFAULT '0',
	`createdByUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `sales_id` PRIMARY KEY(`id`),
	CONSTRAINT `sales_tenant_number_idx` UNIQUE(`tenantId`,`saleNumber`)
);
--> statement-breakpoint
CREATE TABLE `suppliers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`name` varchar(160) NOT NULL,
	`email` varchar(320),
	`phone` varchar(40),
	`notes` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `suppliers_id` PRIMARY KEY(`id`),
	CONSTRAINT `suppliers_tenant_name_idx` UNIQUE(`tenantId`,`name`)
);
--> statement-breakpoint
CREATE TABLE `tenant_memberships` (
	`id` int AUTO_INCREMENT NOT NULL,
	`tenantId` int NOT NULL,
	`userId` int NOT NULL,
	`role` enum('tenant_admin','cashier','inventory_manager') NOT NULL,
	`status` enum('active','inactive') NOT NULL DEFAULT 'active',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenant_memberships_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenant_membership_unique` UNIQUE(`tenantId`,`userId`)
);
--> statement-breakpoint
CREATE TABLE `tenants` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(160) NOT NULL,
	`slug` varchar(160) NOT NULL,
	`businessType` varchar(80) NOT NULL DEFAULT 'Retail',
	`logoUrl` text,
	`currency` varchar(8) NOT NULL DEFAULT 'USD',
	`taxRate` decimal(6,3) NOT NULL DEFAULT '8.25',
	`receiptFooter` text,
	`status` enum('active','suspended','inactive') NOT NULL DEFAULT 'active',
	`ownerUserId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `tenants_id` PRIMARY KEY(`id`),
	CONSTRAINT `tenants_slug_idx` UNIQUE(`slug`)
);
--> statement-breakpoint
CREATE INDEX `audit_tenant_date_idx` ON `audit_logs` (`tenantId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `audit_user_date_idx` ON `audit_logs` (`userId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `customers_tenant_name_idx` ON `customers` (`tenantId`,`name`);--> statement-breakpoint
CREATE INDEX `customers_tenant_email_idx` ON `customers` (`tenantId`,`email`);--> statement-breakpoint
CREATE INDEX `expenses_tenant_date_idx` ON `expenses` (`tenantId`,`expenseDate`);--> statement-breakpoint
CREATE INDEX `inventory_product_date_idx` ON `inventory_movements` (`tenantId`,`productId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `products_tenant_barcode_idx` ON `products` (`tenantId`,`barcode`);--> statement-breakpoint
CREATE INDEX `products_tenant_category_idx` ON `products` (`tenantId`,`categoryId`);--> statement-breakpoint
CREATE INDEX `purchase_items_purchase_idx` ON `purchase_items` (`tenantId`,`purchaseId`);--> statement-breakpoint
CREATE INDEX `purchases_tenant_status_idx` ON `purchases` (`tenantId`,`status`);--> statement-breakpoint
CREATE INDEX `sale_items_sale_idx` ON `sale_items` (`tenantId`,`saleId`);--> statement-breakpoint
CREATE INDEX `sale_items_product_idx` ON `sale_items` (`tenantId`,`productId`);--> statement-breakpoint
CREATE INDEX `sales_tenant_date_idx` ON `sales` (`tenantId`,`createdAt`);--> statement-breakpoint
CREATE INDEX `sales_tenant_status_idx` ON `sales` (`tenantId`,`status`);--> statement-breakpoint
CREATE INDEX `tenant_membership_user_idx` ON `tenant_memberships` (`userId`);--> statement-breakpoint
CREATE INDEX `tenants_owner_idx` ON `tenants` (`ownerUserId`);