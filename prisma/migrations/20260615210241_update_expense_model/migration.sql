/*
  Warnings:

  - You are about to drop the column `categoryId` on the `expense` table. All the data in the column will be lost.
  - You are about to drop the column `notes` on the `expense` table. All the data in the column will be lost.
  - Added the required column `expenseCategoryId` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `Expense` table without a default value. This is not possible if the table is not empty.
  - Added the required column `warehouseId` to the `Expense` table without a default value. This is not possible if the table is not empty.

*/
-- DropForeignKey
ALTER TABLE `expense` DROP FOREIGN KEY `Expense_categoryId_fkey`;

-- DropIndex
DROP INDEX `Expense_categoryId_idx` ON `expense`;

-- AlterTable
ALTER TABLE `expense` DROP COLUMN `categoryId`,
    DROP COLUMN `notes`,
    ADD COLUMN `details` TEXT NULL,
    ADD COLUMN `expenseCategoryId` INTEGER NOT NULL,
    ADD COLUMN `title` VARCHAR(191) NOT NULL,
    ADD COLUMN `warehouseId` INTEGER NOT NULL;

-- CreateIndex
CREATE INDEX `Expense_warehouseId_idx` ON `Expense`(`warehouseId`);

-- CreateIndex
CREATE INDEX `Expense_expenseCategoryId_idx` ON `Expense`(`expenseCategoryId`);

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_warehouseId_fkey` FOREIGN KEY (`warehouseId`) REFERENCES `Warehouse`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `Expense` ADD CONSTRAINT `Expense_expenseCategoryId_fkey` FOREIGN KEY (`expenseCategoryId`) REFERENCES `ExpenseCategory`(`id`) ON DELETE RESTRICT ON UPDATE CASCADE;
