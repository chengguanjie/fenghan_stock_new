import { Request, Response } from 'express';
import { PrismaClient } from '@prisma/client';
import { generateToken } from '../utils/jwt';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password';
import { sendSuccess, sendError, handleError } from '../utils/response';
import { sanitizeName, validateInputSecurity } from '../utils/sanitize';
import { logLogin, logPasswordChange } from '../utils/auditLog';

const prisma = new PrismaClient();

/**
 * 用户登录（通过姓名+密码）
 */
export async function login(req: Request, res: Response) {
  try {
    const { name, password } = req.body;

    if (!name || !password) {
      sendError(res, '请输入姓名和密码', 400);
      return;
    }

    // 清理输入
    const cleanName = sanitizeName(name);
    if (!cleanName) {
      sendError(res, '用户名包含非法字符', 400);
      return;
    }

    // 安全性检查
    const validation = validateInputSecurity(cleanName);
    if (!validation.isValid) {
      sendError(res, `用户名${validation.error}`, 400);
      return;
    }

    // 根据姓名查找用户
    const profile = await prisma.profile.findFirst({
      where: { name: cleanName },
      include: {
        user: {
          include: {
            roles: true,
          },
        },
      },
    });

    if (!profile || !profile.user) {
      await logLogin(cleanName, false, undefined, req.ip, req.get('user-agent'), '用户不存在');
      sendError(res, '用户不存在', 400);
      return;
    }

    // 验证密码
    const isPasswordValid = await verifyPassword(password, profile.user.passwordHash);
    if (!isPasswordValid) {
      await logLogin(cleanName, false, profile.user.id, req.ip, req.get('user-agent'), '密码错误');
      sendError(res, '密码错误', 400);
      return;
    }

    // 生成 JWT Token
    const token = generateToken({
      userId: profile.user.id,
      email: profile.user.email,
      name: profile.name,
      roles: profile.user.roles.map((r) => r.role),
    });

    // 记录成功登录
    await logLogin(cleanName, true, profile.user.id, req.ip, req.get('user-agent'));

    sendSuccess(res, {
      token,
      user: {
        id: profile.user.id,
        email: profile.user.email,
        name: profile.name,
        workshop: profile.workshop,
        roles: profile.user.roles.map((r) => r.role),
        forcePasswordChange: profile.forcePasswordChange,
      },
    }, '登录成功');
  } catch (error) {
    handleError(res, error);
  }
}

/**
 * 获取当前用户信息
 */
export async function getCurrentUser(req: Request, res: Response) {
  try {
    if (!req.user) {
      sendError(res, '未认证', 401);
      return;
    }

    const profile = await prisma.profile.findFirst({
      where: { userId: req.user.userId },
      include: {
        user: {
          include: {
            roles: true,
          },
        },
      },
    });

    if (!profile || !profile.user) {
      sendError(res, '用户不存在', 404);
      return;
    }

    sendSuccess(res, {
      id: profile.user.id,
      email: profile.user.email,
      name: profile.name,
      workshop: profile.workshop,
      roles: profile.user.roles.map((r) => r.role),
      forcePasswordChange: profile.forcePasswordChange,
    });
  } catch (error) {
    handleError(res, error);
  }
}

/**
 * 修改密码
 */
export async function changePassword(req: Request, res: Response) {
  try {
    if (!req.user) {
      sendError(res, '未认证', 401);
      return;
    }

    const { oldPassword, newPassword } = req.body;

    if (!oldPassword || !newPassword) {
      sendError(res, '请提供旧密码和新密码', 400);
      return;
    }

    // 验证新密码强度
    const validation = validatePasswordStrength(newPassword);
    if (!validation.isValid) {
      sendError(res, validation.error || '密码不符合要求', 400);
      return;
    }

    // 获取用户
    const user = await prisma.user.findUnique({
      where: { id: req.user.userId },
      include: { profile: true },
    });

    if (!user) {
      sendError(res, '用户不存在', 404);
      return;
    }

    // 验证旧密码
    const isOldPasswordValid = await verifyPassword(oldPassword, user.passwordHash);
    if (!isOldPasswordValid) {
      sendError(res, '旧密码错误', 400);
      return;
    }

    // 检查新密码是否与旧密码相同
    if (oldPassword === newPassword) {
      sendError(res, '新密码不能与旧密码相同', 400);
      return;
    }

    // 加密新密码
    const newPasswordHash = await hashPassword(newPassword);

    // 更新密码
    await prisma.user.update({
      where: { id: user.id },
      data: { passwordHash: newPasswordHash },
    });

    // 保存密码历史
    await prisma.passwordHistory.create({
      data: {
        userId: user.id,
        passwordHash: newPasswordHash,
      },
    });

    // 记录密码修改日志
    await logPasswordChange(user.id, req.ip, req.get('user-agent'));

    sendSuccess(res, null, '密码修改成功');
  } catch (error) {
    handleError(res, error);
  }
}

/**
 * 退出登录（客户端清除 token，这里只记录日志）
 */
export async function logout(req: Request, res: Response) {
  try {
    if (req.user) {
      // 记录退出日志
      await prisma.auditLog.create({
        data: {
          userId: req.user.userId,
          action: 'logout',
          resourceType: 'user',
          ipAddress: req.ip,
          userAgent: req.get('user-agent'),
        },
      });
    }

    sendSuccess(res, null, '退出登录成功');
  } catch (error) {
    handleError(res, error);
  }
}


