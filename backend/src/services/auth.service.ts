/**
 * 认证服务 - 基于 OpenSEC 规范
 */

import { prisma } from '../config/database';
import { hashPassword, verifyPassword, validatePasswordStrength } from '../utils/password';
import { generateAccessToken, generateRefreshToken } from '../utils/jwt';
import { AppRole } from '@prisma/client';
import { LoginRequest, RegisterRequest, ChangePasswordRequest, AuthResponse, LoginByNameRequest } from '../types/auth.types';
import { logAudit } from '../utils/auditLog';

export class AuthService {
  /**
   * 用户注册
   */
  static async register(data: RegisterRequest): Promise<AuthResponse> {
    // 验证密码强度
    const passwordValidation = validatePasswordStrength(data.password);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.error);
    }

    // 检查邮箱是否已存在
    const existingUser = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existingUser) {
      throw new Error('邮箱已被注册');
    }

    // 加密密码
    const passwordHash = await hashPassword(data.password);

    // 创建用户
    const user = await prisma.user.create({
      data: {
        email: data.email,
        passwordHash,
        profile: {
          create: {
            name: data.name,
            workshop: data.workshop,
            forcePasswordChange: false,
          },
        },
        roles: {
          create: {
            role: AppRole.viewer, // 默认角色为 viewer
          },
        },
      },
      include: {
        profile: true,
        roles: true,
      },
    });

    // 记录审计日志
    await logAudit({
      userId: user.id,
      action: 'user_register',
      resourceType: 'user',
      resourceId: user.id,
      details: { email: user.email, name: data.name },
    });

    // 生成令牌
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.profile!.name,
      roles: user.roles.map(r => r.role),
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.profile!.name,
        workshop: user.profile!.workshop,
        roles: user.roles.map(r => r.role),
        forcePasswordChange: user.profile!.forcePasswordChange,
      },
    };
  }

  /**
   * 按姓名登录
   */
  static async loginByName(data: LoginByNameRequest): Promise<AuthResponse> {
    // 根据姓名查找用户资料和关联用户
    const profile = await prisma.profile.findFirst({
      where: { name: data.name },
      include: {
        user: {
          include: {
            profile: true,
            roles: true,
          },
        },
      },
    });

    if (!profile || !profile.user) {
      await logAudit({
        action: 'login_failed',
        resourceType: 'auth',
        details: { name: data.name, reason: '用户不存在' },
      });
      throw new Error('姓名或密码错误');
    }

    const user = profile.user;

    // 验证密码
    const isValidPassword = await verifyPassword(data.password, user.passwordHash);
    if (!isValidPassword) {
      await logAudit({
        userId: user.id,
        action: 'login_failed',
        resourceType: 'auth',
        resourceId: user.id,
        details: { name: data.name, reason: '密码错误' },
      });
      throw new Error('姓名或密码错误');
    }

    // 记录登录成功
    await logAudit({
      userId: user.id,
      action: 'login_success',
      resourceType: 'auth',
      resourceId: user.id,
      details: { name: data.name },
    });

    // 生成令牌
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.profile!.name,
      roles: user.roles.map(r => r.role),
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.profile!.name,
        workshop: user.profile!.workshop,
        roles: user.roles.map(r => r.role),
        forcePasswordChange: user.profile!.forcePasswordChange,
      },
    };
  }

  /**
   * 用户登录
   */
  static async login(data: LoginRequest): Promise<AuthResponse> {
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { email: data.email },
      include: {
        profile: true,
        roles: true,
      },
    });

    if (!user) {
      await logAudit({
        action: 'login_failed',
        resourceType: 'auth',
        details: { email: data.email, reason: '用户不存在' },
      });
      throw new Error('邮箱或密码错误');
    }

    // 验证密码
    const isValidPassword = await verifyPassword(data.password, user.passwordHash);
    if (!isValidPassword) {
      await logAudit({
        userId: user.id,
        action: 'login_failed',
        resourceType: 'auth',
        resourceId: user.id,
        details: { email: data.email, reason: '密码错误' },
      });
      throw new Error('邮箱或密码错误');
    }

    // 记录登录成功
    await logAudit({
      userId: user.id,
      action: 'login_success',
      resourceType: 'auth',
      resourceId: user.id,
      details: { email: user.email },
    });

    // 生成令牌
    const payload = {
      userId: user.id,
      email: user.email,
      name: user.profile!.name,
      roles: user.roles.map(r => r.role),
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    return {
      accessToken,
      refreshToken,
      user: {
        id: user.id,
        email: user.email,
        name: user.profile!.name,
        workshop: user.profile!.workshop,
        roles: user.roles.map(r => r.role),
        forcePasswordChange: user.profile!.forcePasswordChange,
      },
    };
  }

  /**
   * 修改密码
   */
  static async changePassword(
    userId: string,
    data: ChangePasswordRequest
  ): Promise<void> {
    // 查找用户
    const user = await prisma.user.findUnique({
      where: { id: userId },
      include: { profile: true },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 验证旧密码
    if (!data.oldPassword) {
      throw new Error('请提供当前密码');
    }
    
    const isValidPassword = await verifyPassword(data.oldPassword, user.passwordHash);
    if (!isValidPassword) {
      throw new Error('旧密码错误');
    }

    // 检查新密码是否与旧密码相同
    if (data.oldPassword === data.newPassword) {
      throw new Error('新密码不能与旧密码相同');
    }

    // 验证新密码强度
    const passwordValidation = validatePasswordStrength(data.newPassword);
    if (!passwordValidation.isValid) {
      throw new Error(passwordValidation.error);
    }

    // 加密新密码
    const newPasswordHash = await hashPassword(data.newPassword);

    // 更新密码
    await prisma.user.update({
      where: { id: userId },
      data: {
        passwordHash: newPasswordHash,
      },
    });

    // 保存密码历史
    await prisma.passwordHistory.create({
      data: {
        userId,
        passwordHash: user.passwordHash,
      },
    });

    // 记录审计日志
    await logAudit({
      userId,
      action: 'password_changed',
      resourceType: 'user',
      resourceId: userId,
      details: { email: user.email },
    });
  }

  /**
   * 刷新访问令牌
   */
  static async refreshAccessToken(refreshToken: string): Promise<{ accessToken: string }> {
    try {
      // 验证刷新令牌
      const { verifyRefreshToken } = await import('../utils/jwt');
      const payload = verifyRefreshToken(refreshToken);

      if (!payload) {
        throw new Error('刷新令牌无效');
      }

      // 查找用户
      const user = await prisma.user.findUnique({
        where: { id: payload.userId },
        include: {
          roles: true,
          profile: true,
        },
      });

      if (!user) {
        throw new Error('用户不存在');
      }

      // 生成新的访问令牌
      const newPayload = {
        userId: user.id,
        email: user.email,
        name: user.profile!.name,
        roles: user.roles.map(r => r.role),
      };

      const accessToken = generateAccessToken(newPayload);

      return { accessToken };
    } catch (error) {
      throw new Error('刷新令牌无效或已过期');
    }
  }
}
