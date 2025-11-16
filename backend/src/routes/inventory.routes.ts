/**
 * 库存盘点路由
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { InventoryController } from '../controllers/inventory.controller';
import { validate, createInventoryRecordSchema, updateInventoryRecordSchema } from '../middleware/validator.middleware';
import { upload } from '../config/multer';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取当前用户的物料及其盘点记录
router.get('/user-items', InventoryController.getUserItemsWithRecords);

// 获取所有物料及其盘点记录状态(用于Summary和Console查询)
router.get('/items-with-status', InventoryController.getAllItemsWithRecordStatus);

// 获取盘点记录列表
router.get('/records', InventoryController.getRecords);

// 获取单个盘点记录详情
router.get('/records/:id', InventoryController.getRecordById);

// 创建盘点记录
router.post('/records', validate(createInventoryRecordSchema), InventoryController.createRecord);

// 更新盘点记录
router.put('/records/:id', validate(updateInventoryRecordSchema), InventoryController.updateRecord);

// 删除盘点记录
router.delete('/records/:id', InventoryController.deleteRecord);

// 批量提交盘点记录 - 必须在 :id 路由之前
router.post('/records/batch/submit', InventoryController.submitMultipleRecords);

// 提交单个盘点记录
router.post('/records/:id/submit', InventoryController.submitRecord);

// 上传物料Excel文件
router.post('/items/upload', upload.single('file'), InventoryController.uploadExcel);

export default router;
