/**
 * JWT 认证中间件
 */

import { Request, Response, NextFunction } from 'express';
import { verifyAccessToken } from '../utils/jwt';
import { prisma } from '../config/database';
import { JWTPayload } from '../types/auth.types';

// 扩展 Express Request 类型
declare global {
  namespace Express {
    interface Request {
      user?: JWTPayload & {
        forcePasswordChange?: boolean;
      };
    }
  }
}

/**
 * 验证 JWT Token 中间件
 */
export async function authenticateToken(
  req: Request,
  res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        error: '未提供认证令牌',
      });
      return;
    }

    // 验证 token
    const payload = verifyAccessToken(token);
    
    if (!payload) {
      res.status(401).json({
        success: false,
        error: '无效的认证令牌',
      });
      return;
    }

    // 检查用户是否存在且激活
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        profile: true,
        roles: true,
      },
    });

    if (!user) {
      res.status(401).json({
        success: false,
        error: '用户不存在',
      });
      return;
    }

    // 将用户信息附加到请求对象
    req.user = {
      ...payload,
      forcePasswordChange: user.profile?.forcePasswordChange,
    };

    next();
  } catch (error) {
    res.status(401).json({
      success: false,
      error: '认证失败',
    });
  }
}

/**
 * 可选认证中间件（不强制要求登录）
 */
export async function optionalAuth(
  req: Request,
  _res: Response,
  next: NextFunction
): Promise<void> {
  try {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      const payload = verifyAccessToken(token);
      if (payload) {
        req.user = payload;
      }
    }

    next();
  } catch (error) {
    // 忽略错误，继续执行
    next();
  }
}
