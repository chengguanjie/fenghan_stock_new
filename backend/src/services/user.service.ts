/**
 * 用户管理服务
 */

import { prisma } from '../config/database';
import { AppRole } from '@prisma/client';
import { hashPassword } from '../utils/password';
import { logAudit } from '../utils/auditLog';

export interface CreateUserData {
  email: string;
  password: string;
  name: string;
  workshop: string;
  role?: AppRole;
}

export interface UpdateUserData {
  name?: string;
  workshop?: string;
  role?: AppRole;
}

export interface UserQuery {
  page?: number;
  pageSize?: number;
  workshop?: string;
  role?: AppRole;
}

export class UserService {
  /**
   * 获取用户列表（仅管理员）
   */
  static async getUsers(query: UserQuery) {
    const page = query.page || 1;
    const pageSize = query.pageSize || 20;
    const skip = (page - 1) * pageSize;

    interface WhereClause {
      profile?: {
        workshop?: string;
      };
      roles?: {
        some: {
          role: AppRole;
        };
      };
    }

    const where: WhereClause = {};
    if (query.workshop) {
      where.profile = { workshop: query.workshop };
    }
    if (query.role) {
      where.roles = { some: { role: query.role } };
    }

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        where,
        skip,
        take: pageSize,
        include: {
          profile: true,
          roles: true,
        },
        orderBy: { createdAt: 'desc' },
      }),
      prisma.user.count({ where }),
    ]);

    return {
      users: users.map(user => ({
        id: user.id,
        email: user.email,
        name: user.profile?.name,
        workshop: user.profile?.workshop,
        roles: user.roles.map(r => r.role),
        forcePasswordChange: user.profile?.forcePasswordChange,
        createdAt: user.createdAt,
      })),
      pagination: {
        page,
        pageSize,
        total,
        totalPages: Math.ceil(total / pageSize),
      },
    };
  }

  /**
   * 获取用户详情
   */
  static async getUserById(id: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: {
        profile: true,
        roles: true,
      },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    return {
      id: user.id,
      email: user.email,
      name: user.profile?.name,
      workshop: user.profile?.workshop,
      roles: user.roles.map(r => r.role),
      forcePasswordChange: user.profile?.forcePasswordChange,
      createdAt: user.createdAt,
      updatedAt: user.updatedAt,
    };
  }

  /**
   * 创建用户（仅管理员）
   */
  static async createUser(data: CreateUserData, adminId: string) {
    // 检查邮箱是否已存在
    const existing = await prisma.user.findUnique({
      where: { email: data.email },
    });

    if (existing) {
      throw new Error('邮箱已被注册');
    }

    const passwordHash = await hashPassword(data.password);

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
            role: data.role || AppRole.viewer,
          },
        },
      },
      include: {
        profile: true,
        roles: true,
      },
    });

    await logAudit({
      userId: adminId,
      action: 'user_created',
      resourceType: 'user',
      resourceId: user.id,
      details: {
        email: user.email,
        name: data.name,
        role: data.role || AppRole.viewer,
      },
    });

    return {
      id: user.id,
      email: user.email,
      name: user.profile!.name,
      workshop: user.profile!.workshop,
      roles: user.roles.map(r => r.role),
    };
  }

  /**
   * 更新用户信息
   */
  static async updateUser(id: string, data: UpdateUserData, operatorId: string) {
    const user = await prisma.user.findUnique({
      where: { id },
      include: { profile: true, roles: true },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 更新用户资料
    if (data.name || data.workshop) {
      await prisma.profile.update({
        where: { userId: id },
        data: {
          name: data.name,
          workshop: data.workshop,
        },
      });
    }

    // 更新角色
    if (data.role) {
      await prisma.userRole.deleteMany({
        where: { userId: id },
      });
      await prisma.userRole.create({
        data: {
          userId: id,
          role: data.role,
        },
      });
    }

    await logAudit({
      userId: operatorId,
      action: 'user_updated',
      resourceType: 'user',
      resourceId: id,
      details: data,
    });

    return this.getUserById(id);
  }

  /**
   * 删除用户（仅管理员）
   */
  static async deleteUser(id: string, adminId: string) {
    const user = await prisma.user.findUnique({
      where: { id },
    });

    if (!user) {
      throw new Error('用户不存在');
    }

    // 不能删除自己
    if (id === adminId) {
      throw new Error('不能删除自己的账号');
    }

    await prisma.user.delete({
      where: { id },
    });

    await logAudit({
      userId: adminId,
      action: 'user_deleted',
      resourceType: 'user',
      resourceId: id,
      details: { deletedUserId: id },
    });

    return { success: true };
  }
}
