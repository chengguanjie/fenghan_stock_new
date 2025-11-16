import { Request, Response, NextFunction } from 'express';

/**
 * 管理员权限中间件
 * 检查用户是否具有管理员角色
 * 必须在 authMiddleware 之后使用
 */
export function adminAuthMiddleware(
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

  const isAdmin = req.user.roles.includes('admin');

  if (!isAdmin) {
    res.status(403).json({
      success: false,
      error: '无权限访问此资源',
    });
    return;
  }

  next();
}


