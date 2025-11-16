/**
 * RBAC 权限控制中间件 - 基于 OpenSEC 规范
 */

import { Request, Response, NextFunction } from 'express';
import { AppRole } from '@prisma/client';

/**
 * 检查用户是否拥有指定角色
 */
export function requireRole(...allowedRoles: AppRole[]) {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user) {
      res.status(401).json({
        success: false,
        error: '未认证',
      });
      return;
    }

    const userRoles = req.user.roles;
    const hasRole = allowedRoles.some(role => userRoles.includes(role));

    if (!hasRole) {
      res.status(403).json({
        success: false,
        error: '权限不足',
        message: `需要以下角色之一: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    next();
  };
}

/**
 * 仅管理员可访问
 */
export function requireAdmin(req: Request, res: Response, next: NextFunction): void {
  return requireRole(AppRole.admin)(req, res, next);
}

/**
 * 检查用户是否需要强制修改密码
 */
export function checkPasswordChangeRequired(
  req: Request,
  res: Response,
  next: NextFunction
): void {
  if (!req.user) {
    res.status(401).json({
      success: false,
      error: '未认证',
    });
    return;
  }

  next();
}
