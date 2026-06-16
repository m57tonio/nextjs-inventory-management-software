-- AlterTable
ALTER TABLE `role` ADD COLUMN `deletedAt` DATETIME(3) NULL;

-- AlterTable
ALTER TABLE `user` ADD COLUMN `roleId` INTEGER NULL;

-- CreateTable
CREATE TABLE `RolePermission` (
    `roleId` INTEGER NOT NULL,
    `permission` VARCHAR(191) NOT NULL,

    INDEX `RolePermission_roleId_idx`(`roleId`),
    PRIMARY KEY (`roleId`, `permission`)
) DEFAULT CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;

-- CreateIndex
CREATE INDEX `Role_deletedAt_idx` ON `Role`(`deletedAt`);

-- CreateIndex
CREATE INDEX `User_roleId_idx` ON `User`(`roleId`);

-- AddForeignKey
ALTER TABLE `User` ADD CONSTRAINT `User_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE `RolePermission` ADD CONSTRAINT `RolePermission_roleId_fkey` FOREIGN KEY (`roleId`) REFERENCES `Role`(`id`) ON DELETE CASCADE ON UPDATE CASCADE;
