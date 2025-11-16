/**
 * 盘点记录控制器
 */

import { Request, Response } from 'express';
import { InventoryService } from '../services/inventory.service';
import { RecordStatus } from '@prisma/client';

export class InventoryController {
  /**
   * 创建盘点记录
   */
  static async createRecord(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未认证',
        });
        return;
      }

      const record = await InventoryService.createRecord(req.user.userId, req.body);

      res.status(201).json({
        success: true,
        message: '盘点记录创建成功',
        data: record,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建失败',
      });
    }
  }

  /**
   * 获取当前用户的物料及其盘点记录
   */
  static async getUserItemsWithRecords(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未认证',
        });
        return;
      }

      const data = await InventoryService.getUserItemsWithRecords(req.user.userId);

      res.json({
        success: true,
        data,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '获取失败',
      });
    }
  }

  /**
   * 获取盘点记录列表
   */
  static async getRecords(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未认证',
        });
        return;
      }

      const query = {
        userId: req.query.userId as string,
        status: req.query.status as RecordStatus,
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
      };

      // 非管理员只能查看自己的记录
      const isAdmin = req.user.roles?.includes('admin');
      if (!isAdmin) {
        query.userId = req.user.userId;
      }

      const result = await InventoryService.getRecords(query);

      res.json({
        success: true,
        data: result.records,
        pagination: result.pagination,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '获取失败',
      });
    }
  }

  /**
   * 获取单个盘点记录详情
   */
  static async getRecordById(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未认证',
        });
        return;
      }

      const isAdmin = req.user.roles?.includes('admin');
      const userId = isAdmin ? undefined : req.user.userId;

      const record = await InventoryService.getRecordById(req.params.id, userId);

      res.json({
        success: true,
        data: record,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '获取失败',
      });
    }
  }

  /**
   * 更新盘点记录
   */
  static async updateRecord(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未认证',
        });
        return;
      }

      const record = await InventoryService.updateRecord(
        req.params.id,
        req.user.userId,
        req.body
      );

      res.json({
        success: true,
        message: '记录更新成功',
        data: record,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '更新失败',
      });
    }
  }

  /**
   * 删除盘点记录
   */
  static async deleteRecord(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未认证',
        });
        return;
      }

      const isAdmin = req.user.roles?.includes('admin');
      await InventoryService.deleteRecord(req.params.id, req.user.userId, isAdmin);

      res.json({
        success: true,
        message: '记录删除成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '删除失败',
      });
    }
  }

  /**
   * 提交盘点记录
   */
  static async submitRecord(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未认证',
        });
        return;
      }

      const record = await InventoryService.submitRecord(req.params.id, req.user.userId);

      res.json({
        success: true,
        message: '记录提交成功',
        data: record,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '提交失败',
      });
    }
  }

  /**
   * 批量提交盘点记录
   */
  static async submitMultipleRecords(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未认证',
        });
        return;
      }

      const { recordIds } = req.body;

      if (!Array.isArray(recordIds) || recordIds.length === 0) {
        res.status(400).json({
          success: false,
          error: '请提供有效的记录ID列表',
        });
        return;
      }

      const result = await InventoryService.submitMultipleRecords(recordIds, req.user.userId);

      res.json({
        success: true,
        message: `成功提交 ${result.count} 条记录`,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '批量提交失败',
      });
    }
  }

  /**
   * 上传物料Excel文件
   */
  static async uploadExcel(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未认证',
        });
        return;
      }

      if (!req.file) {
        res.status(400).json({
          success: false,
          error: '请上传Excel文件',
        });
        return;
      }

      const result = await InventoryService.uploadItemsFromExcel(
        req.file.buffer,
        req.user.userId
      );

      res.status(201).json({
        success: true,
        message: `成功上传 ${result.count} 条物料数据`,
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '上传失败',
      });
    }
  }

  /**
   * 获取所有物料及其盘点记录状态
   * 用于Summary页面和Console数据查询
   */
  static async getAllItemsWithRecordStatus(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未认证',
        });
        return;
      }

      const query = {
        startDate: req.query.startDate as string,
        endDate: req.query.endDate as string,
        userId: req.query.userId as string,
      };

      // 非管理员只能查看自己的物料
      const isAdmin = req.user.roles?.includes('admin');
      if (!isAdmin) {
        query.userId = req.user.userId;
      }

      const items = await InventoryService.getAllItemsWithRecordStatus(query);

      res.json({
        success: true,
        data: items,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '获取失败',
      });
    }
  }
}
