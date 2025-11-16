/**
 * 认证控制器
 */

import { Request, Response } from 'express';
import { AuthService } from '../services/auth.service';
import { LoginRequest, RegisterRequest, ChangePasswordRequest, LoginByNameRequest } from '../types/auth.types';

export class AuthController {
  /**
   * 用户注册
   */
  static async register(req: Request, res: Response): Promise<void> {
    try {
      const data: RegisterRequest = req.body;
      const result = await AuthService.register(data);

      res.status(201).json({
        success: true,
        message: '注册成功',
        data: result,
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '注册失败',
      });
    }
  }

  /**
   * 按姓名登录
   */
  static async loginByName(req: Request, res: Response): Promise<void> {
    try {
      const data: LoginByNameRequest = req.body;
      const result = await AuthService.loginByName(data);

      res.json({
        success: true,
        message: '登录成功',
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : '登录失败',
      });
    }
  }

  /**
   * 用户登录
   */
  static async login(req: Request, res: Response): Promise<void> {
    try {
      const data: LoginRequest = req.body;
      const result = await AuthService.login(data);

      res.json({
        success: true,
        message: '登录成功',
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : '登录失败',
      });
    }
  }

  /**
   * 修改密码
   */
  static async changePassword(req: Request, res: Response): Promise<void> {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          error: '未认证',
        });
        return;
      }

      const data: ChangePasswordRequest = req.body;
      await AuthService.changePassword(req.user.userId, data);

      res.json({
        success: true,
        message: '密码修改成功',
      });
    } catch (error) {
      res.status(400).json({
        success: false,
        error: error instanceof Error ? error.message : '密码修改失败',
      });
    }
  }

  /**
   * 登出
   */
  static async logout(_req: Request, res: Response): Promise<void> {
    // JWT 是无状态的，登出主要由前端处理（删除 token）
    // 这里可以记录审计日志
    res.json({
      success: true,
      message: '登出成功',
    });
  }

  /**
   * 刷新令牌
   */
  static async refreshToken(req: Request, res: Response): Promise<void> {
    try {
      const { refreshToken } = req.body;

      if (!refreshToken) {
        res.status(400).json({
          success: false,
          error: '缺少刷新令牌',
        });
        return;
      }

      const result = await AuthService.refreshAccessToken(refreshToken);

      res.json({
        success: true,
        message: '令牌刷新成功',
        data: result,
      });
    } catch (error) {
      res.status(401).json({
        success: false,
        error: error instanceof Error ? error.message : '令牌刷新失败',
      });
    }
  }
}
