/**
 * 用户管理控制器
 */

import { Request, Response } from 'express';
import { UserService } from '../services/user.service';
import { AppRole } from '@prisma/client';

export class UserController {
  /**
   * 获取用户列表（仅管理员）
   */
  static async getUsers(req: Request, res: Response): Promise<void> {
    try {
      const query = {
        page: req.query.page ? parseInt(req.query.page as string) : undefined,
        pageSize: req.query.pageSize ? parseInt(req.query.pageSize as string) : undefined,
        workshop: req.query.workshop as string,
        role: req.query.role as AppRole,
      };

      const result = await UserService.getUsers(query);

      res.json({
        success: true,
        data: result.users,
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
   * 获取用户详情
   */
  static async getUserById(req: Request, res: Response): Promise<void> {
    try {
      const user = await UserService.getUserById(req.params.id);

      res.json({
        success: true,
        data: user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '获取失败',
      });
    }
  }

  /**
   * 创建用户（仅管理员）
   */
  static async createUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未认证',
        });
        return;
      }

      // 从请求体中提取数据
      const { name, workshop, role } = req.body;

      // 验证必需字段
      if (!name || !workshop) {
        res.status(400).json({
          success: false,
          error: '姓名和车间为必填项',
        });
        return;
      }

      // 生成唯一的 email (使用姓名@车间.local 格式)
      // 如果重复,会在 service 层抛出错误
      const email = `${name}@${workshop}.local`;

      // 构造完整的用户数据
      const userData = {
        email,
        password: '123456', // 默认密码
        name,
        workshop,
        role: role as AppRole | undefined,
      };

      const user = await UserService.createUser(userData, req.user.userId);

      res.status(201).json({
        success: true,
        message: '用户创建成功',
        data: user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建失败',
      });
    }
  }

  /**
   * 更新用户信息
   */
  static async updateUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未认证',
        });
        return;
      }

      const user = await UserService.updateUser(
        req.params.id,
        req.body,
        req.user.userId
      );

      res.json({
        success: true,
        message: '用户信息更新成功',
        data: user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '更新失败',
      });
    }
  }

  /**
   * 删除用户（仅管理员）
   */
  static async deleteUser(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未认证',
        });
        return;
      }

      await UserService.deleteUser(req.params.id, req.user.userId);

      res.json({
        success: true,
        message: '用户删除成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '删除失败',
      });
    }
  }

  /**
   * 创建管理员账户（仅管理员）
   */
  static async createAdmin(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未认证',
        });
        return;
      }

      const { email, password, name, workshop } = req.body;

      if (!email || !password || !name || !workshop) {
        res.status(400).json({
          success: false,
          error: 'Email、密码、姓名和车间为必填项',
        });
        return;
      }

      const userData = {
        email,
        password,
        name,
        workshop,
        role: 'admin' as AppRole,
      };

      const user = await UserService.createUser(userData, req.user.userId);

      res.status(201).json({
        success: true,
        message: '管理员创建成功',
        data: user,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '创建失败',
      });
    }
  }
}
