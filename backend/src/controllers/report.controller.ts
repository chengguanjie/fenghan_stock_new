/**
 * 报表统计控制器
 */

import { Request, Response } from 'express';
import { ReportService } from '../services/report.service';

export class ReportController {
  /**
   * 获取统计报表数据
   */
  static async getStatistics(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未认证',
        });
        return;
      }

      // 管理员可以查看所有数据，普通用户只能查看自己的
      const isAdmin = req.user.roles?.includes('admin');
      const userId = isAdmin ? undefined : req.user.userId;

      const statistics = await ReportService.getSummary(userId);

      res.json({
        success: true,
        data: {
          totalRecords: statistics.overview.totalRecords,
          draftRecords: statistics.overview.draftRecords,
          submittedRecords: statistics.overview.submittedRecords,
        },
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '获取失败',
      });
    }
  }

  /**
   * 获取汇总统计数据
   */
  static async getSummary(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未认证',
        });
        return;
      }

      // 管理员可以查看所有数据，普通用户只能查看自己的
      const isAdmin = req.user.roles?.includes('admin');
      const userId = isAdmin ? undefined : req.user.userId;

      const summary = await ReportService.getSummary(userId);

      res.json({
        success: true,
        data: summary,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '获取失败',
      });
    }
  }

  /**
   * 获取盘点进度统计
   */
  static async getProgress(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未认证',
        });
        return;
      }

      const progress = await ReportService.getProgress();

      res.json({
        success: true,
        data: progress,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '获取失败',
      });
    }
  }

  /**
   * 导出盘点数据为Excel
   */
  static async exportToExcel(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未认证',
        });
        return;
      }

      // 管理员可以导出所有数据，普通用户只能导出自己的
      const isAdmin = req.user.roles?.includes('admin');
      const userId = isAdmin ? undefined : req.user.userId;

      const buffer = await ReportService.exportToExcel(userId);

      // 设置响应头
      res.setHeader(
        'Content-Type',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      );
      res.setHeader(
        'Content-Disposition',
        `attachment; filename=inventory-report-${new Date().toISOString().split('T')[0]}.xlsx`
      );

      res.send(buffer);
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '导出失败',
      });
    }
  }
}
