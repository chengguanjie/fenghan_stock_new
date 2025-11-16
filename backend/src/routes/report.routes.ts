/**
 * 报表路由
 */

import { Router } from 'express';
import { authenticateToken } from '../middleware/auth.middleware';
import { ReportController } from '../controllers/report.controller';

const router = Router();

// 所有路由都需要认证
router.use(authenticateToken);

// 获取统计报表
router.get('/statistics', ReportController.getStatistics);

// 获取汇总数据
router.get('/summary', ReportController.getSummary);

// 获取盘点进度
router.get('/progress', ReportController.getProgress);

// 导出Excel数据
router.get('/export', ReportController.exportToExcel);

export default router;
