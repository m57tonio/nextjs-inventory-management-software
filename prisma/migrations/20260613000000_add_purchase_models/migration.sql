-- AddColumn: Warehouse.purchases relation (no DB change needed, relation only)
-- AddColumn: Supplier.purchases relation (no DB change needed, relation only)
-- AddColumn: Product.purchaseItems relation (no DB change needed, relation only)

-- CreateTable: Purchase
CREATE TABLE `Purchase` (
  `id`            INT             NOT NULL AUTO_INCREMENT,
  `reference`     VARCHAR(191)    NOT NULL,
  `supplierId`    INT             NOT NULL,
  `warehouseId`   INT             NOT NULL,
  `date`          DATETIME(3)     NOT NULL,
  `status`        VARCHAR(191)    NOT NULL DEFAULT 'Received',
  `orderTax`      DECIMAL(5,2)    NOT NULL DEFAULT 0,
  `discount`      DECIMAL(12,2)   NOT NULL DEFAULT 0,
  `shipping`      DECIMAL(12,2)   NOT NULL DEFAULT 0,
  `grandTotal`    DECIMAL(14,2)   NOT NULL,
  `paymentType`   VARCHAR(191)    NOT NULL DEFAULT 'Cash',
  `paymentStatus` VARCHAR(191)    NOT NULL DEFAULT 'Paid',
  `notes`         TEXT            NULL,
  `createdAt`     DATETIME(3)     NOT NULL DEFAULT CURRENT_TIMESTAMP(3),
  `updatedAt`     DATETIME(3)     NOT NULL,
  `deletedAt`     DATETIME(3)     NULL,

  UNIQUE INDEX `Purchase_reference_key`(`reference`),
  INDEX `Purchase_deletedAt_idx`(`deletedAt`),
  INDEX `Purchase_supplierId_idx`(`supplierId`),
  INDEX `Purchase_warehouseId_idx`(`warehouseId`),
  INDEX `Purchase_status_idx`(`status`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateTable: PurchaseItem
CREATE TABLE `PurchaseItem` (
  `id`           INT           NOT NULL AUTO_INCREMENT,
  `purchaseId`   INT           NOT NULL,
  `productId`    INT           NOT NULL,
  `netUnitCost`  DECIMAL(12,2) NOT NULL,
  `quantity`     INT           NOT NULL,
  `discountType` VARCHAR(191)  NOT NULL DEFAULT 'Fixed',
  `discount`     DECIMAL(12,2) NOT NULL DEFAULT 0,
  `taxType`      VARCHAR(191)  NOT NULL DEFAULT 'Exclusive',
  `orderTax`     DECIMAL(5,2)  NOT NULL DEFAULT 0,
  `subtotal`     DECIMAL(14,2) NOT NULL,
  `purchaseUnit` VARCHAR(191)  NOT NULL,
  `createdAt`    DATETIME(3)   NOT NULL DEFAULT CURRENT_TIMESTAMP(3),

  INDEX `PurchaseItem_purchaseId_idx`(`purchaseId`),
  INDEX `PurchaseItem_productId_idx`(`productId`),
  PRIMARY KEY (`id`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- AddForeignKey
ALTER TABLE `Purchase` ADD CONSTRAINT `Purchase_supplierId_fkey`
  FOREIGN KEY (`supplierId`) REFERENCES `Supplier`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `Purchase` ADD CONSTRAINT `Purchase_warehouseId_fkey`
  FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `PurchaseItem` ADD CONSTRAINT `PurchaseItem_purchaseId_fkey`
  FOREIGN KEY (`purchaseId`) REFERENCES `Purchase`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;

ALTER TABLE `PurchaseItem` ADD CONSTRAINT `PurchaseItem_productId_fkey`
  FOREIGN KEY (`productId`) REFERENCES `Product`(`id`)
  ON DELETE RESTRICT ON UPDATE CASCADE;
