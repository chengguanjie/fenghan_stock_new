-- 添加物料编码字段
ALTER TABLE `inventory_items` ADD COLUMN `material_code` VARCHAR(100) NULL AFTER `area`;
