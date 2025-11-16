/**
 * OpenSEC 访问控制实现
 * 基于安全策略配置的权限验证系统
 */

import { authService, User as AuthUser } from '../src/lib/auth';
import { AuditLogger, AuditEventType, AuditEventStatus } from './audit-logger';

// 角色定义
export enum Role {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
}

// 权限定义
export enum Permission {
  // 用户权限
  USER_CREATE = 'user:create',
  USER_READ = 'user:read',
  USER_UPDATE = 'user:update',
  USER_DELETE = 'user:delete',
  
  // 库存权限
  INVENTORY_CREATE = 'inventory:create',
  INVENTORY_READ = 'inventory:read',
  INVENTORY_UPDATE = 'inventory:update',
  INVENTORY_DELETE = 'inventory:delete',
  INVENTORY_APPROVE = 'inventory:approve',
  INVENTORY_REJECT = 'inventory:reject',
  
  // 报表权限
  REPORT_READ = 'report:read',
  REPORT_EXPORT = 'report:export',
  
  // 系统权限
  SYSTEM_CONFIGURE = 'system:configure',
}

// 角色权限映射
const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.ADMIN]: [
    Permission.USER_CREATE,
    Permission.USER_READ,
    Permission.USER_UPDATE,
    Permission.USER_DELETE,
    Permission.INVENTORY_CREATE,
    Permission.INVENTORY_READ,
    Permission.INVENTORY_UPDATE,
    Permission.INVENTORY_DELETE,
    Permission.INVENTORY_APPROVE,
    Permission.INVENTORY_REJECT,
    Permission.REPORT_READ,
    Permission.REPORT_EXPORT,
    Permission.SYSTEM_CONFIGURE,
  ],
  [Role.OPERATOR]: [
    Permission.INVENTORY_CREATE,
    Permission.INVENTORY_READ,
    Permission.INVENTORY_UPDATE,
    Permission.REPORT_READ,
  ],
  [Role.VIEWER]: [
    Permission.INVENTORY_READ,
    Permission.REPORT_READ,
  ],
};

// 用户上下文接口
export interface UserContext {
  id: string;
  username: string;
  role: Role;
  is_active: boolean;
  force_password_change: boolean;
  email?: string;
}

// 访问控制结果
export interface AccessControlResult {
  allowed: boolean;
  reason?: string;
}

/**
 * 访问控制类
 */
export class AccessControl {
  /**
   * 检查用户是否拥有指定权限
   */
  static hasPermission(user: UserContext, permission: Permission): boolean {
    const rolePermissions = ROLE_PERMISSIONS[user.role];
    return rolePermissions.includes(permission);
  }

  /**
   * 检查用户是否拥有指定角色
   */
  static hasRole(user: UserContext, role: Role): boolean {
    return user.role === role;
  }

  /**
   * 检查用户是否拥有任一指定角色
   */
  static hasAnyRole(user: UserContext, roles: Role[]): boolean {
    return roles.includes(user.role);
  }

  /**
   * 验证用户基本状态
   */
  static validateUserState(user: UserContext): AccessControlResult {
    if (!user.is_active) {
      return {
        allowed: false,
        reason: '用户账户已被停用',
      };
    }

    if (user.force_password_change) {
      return {
        allowed: false,
        reason: '需要修改密码后才能继续操作',
      };
    }

    return { allowed: true };
  }

  /**
   * 验证创建盘点记录权限
   */
  static canCreateInventoryRecord(user: UserContext): AccessControlResult {
    // 验证用户状态
    const stateCheck = this.validateUserState(user);
    if (!stateCheck.allowed) {
      return stateCheck;
    }

    // 验证权限
    if (!this.hasPermission(user, Permission.INVENTORY_CREATE)) {
      return {
        allowed: false,
        reason: '没有创建盘点记录的权限',
      };
    }

    return { allowed: true };
  }

  /**
   * 验证读取盘点记录权限
   */
  static canReadInventoryRecord(user: UserContext): AccessControlResult {
    // 验证用户状态
    const stateCheck = this.validateUserState(user);
    if (!stateCheck.allowed) {
      return stateCheck;
    }

    // 验证权限
    if (!this.hasPermission(user, Permission.INVENTORY_READ)) {
      return {
        allowed: false,
        reason: '没有查看盘点记录的权限',
      };
    }

    return { allowed: true };
  }

  /**
   * 验证更新盘点记录权限
   */
  static canUpdateInventoryRecord(
    user: UserContext,
    recordStatus: string
  ): AccessControlResult {
    // 验证用户状态
    const stateCheck = this.validateUserState(user);
    if (!stateCheck.allowed) {
      return stateCheck;
    }

    // 验证权限
    if (!this.hasPermission(user, Permission.INVENTORY_UPDATE)) {
      return {
        allowed: false,
        reason: '没有更新盘点记录的权限',
      };
    }

    // 只有管理员可以更新已审核的记录
    if (recordStatus !== 'pending' && user.role !== Role.ADMIN) {
      return {
        allowed: false,
        reason: '只有管理员可以修改已审核的记录',
      };
    }

    return { allowed: true };
  }

  /**
   * 验证删除盘点记录权限
   */
  static canDeleteInventoryRecord(user: UserContext): AccessControlResult {
    // 验证用户状态
    const stateCheck = this.validateUserState(user);
    if (!stateCheck.allowed) {
      return stateCheck;
    }

    // 只有管理员可以删除
    if (!this.hasPermission(user, Permission.INVENTORY_DELETE)) {
      return {
        allowed: false,
        reason: '只有管理员可以删除盘点记录',
      };
    }

    return { allowed: true };
  }

  /**
   * 验证审核盘点记录权限
   */
  static canApproveInventoryRecord(
    user: UserContext,
    recordStatus: string
  ): AccessControlResult {
    // 验证用户状态
    const stateCheck = this.validateUserState(user);
    if (!stateCheck.allowed) {
      return stateCheck;
    }

    // 只有管理员可以审核
    if (!this.hasPermission(user, Permission.INVENTORY_APPROVE)) {
      return {
        allowed: false,
        reason: '只有管理员可以审核盘点记录',
      };
    }

    // 只能审核待审核状态的记录
    if (recordStatus !== 'pending') {
      return {
        allowed: false,
        reason: '只能审核待审核状态的记录',
      };
    }

    return { allowed: true };
  }

  /**
   * 验证用户管理权限
   */
  static canManageUsers(user: UserContext): AccessControlResult {
    // 验证用户状态
    const stateCheck = this.validateUserState(user);
    if (!stateCheck.allowed) {
      return stateCheck;
    }

    // 只有管理员可以管理用户
    if (user.role !== Role.ADMIN) {
      return {
        allowed: false,
        reason: '只有管理员可以管理用户',
      };
    }

    return { allowed: true };
  }

  /**
   * 验证更新用户权限
   */
  static canUpdateUser(
    user: UserContext,
    targetUserId: string,
    isSelfUpdate: boolean
  ): AccessControlResult {
    // 验证用户状态
    const stateCheck = this.validateUserState(user);
    if (!stateCheck.allowed) {
      return stateCheck;
    }

    // 用户可以更新自己的信息
    if (isSelfUpdate && user.id === targetUserId) {
      return { allowed: true };
    }

    // 管理员可以更新其他用户
    if (!this.hasPermission(user, Permission.USER_UPDATE)) {
      return {
        allowed: false,
        reason: '没有更新用户信息的权限',
      };
    }

    return { allowed: true };
  }

  /**
   * 验证删除用户权限
   */
  static canDeleteUser(
    user: UserContext,
    targetUserId: string
  ): AccessControlResult {
    // 验证用户状态
    const stateCheck = this.validateUserState(user);
    if (!stateCheck.allowed) {
      return stateCheck;
    }

    // 不能删除自己
    if (user.id === targetUserId) {
      return {
        allowed: false,
        reason: '不能删除自己的账户',
      };
    }

    // 只有管理员可以删除用户
    if (!this.hasPermission(user, Permission.USER_DELETE)) {
      return {
        allowed: false,
        reason: '只有管理员可以删除用户',
      };
    }

    return { allowed: true };
  }

  /**
   * 验证导出数据权限
   */
  static canExportData(user: UserContext): AccessControlResult {
    // 验证用户状态
    const stateCheck = this.validateUserState(user);
    if (!stateCheck.allowed) {
      return stateCheck;
    }

    // 验证权限
    if (!this.hasPermission(user, Permission.REPORT_EXPORT)) {
      return {
        allowed: false,
        reason: '没有导出数据的权限',
      };
    }

    return { allowed: true };
  }

  /**
   * 获取当前登录用户的上下文
   * 基于 authService（MySQL 后端）
   */
  static async getCurrentUserContext(): Promise<UserContext | null> {
    try {
      // 从 authService 获取当前用户
      const user: AuthUser | null = authService.getCurrentUser();
      
      if (!user) {
        return null;
      }

      // 将 authService 的用户信息映射到 UserContext
      // 角色映射：从 user.roles 数组中取第一个角色
      let role: Role = Role.OPERATOR; // 默认角色
      if (user.roles && user.roles.length > 0) {
        const roleStr = user.roles[0].toLowerCase();
        if (roleStr === 'admin') {
          role = Role.ADMIN;
        } else if (roleStr === 'viewer') {
          role = Role.VIEWER;
        } else {
          role = Role.OPERATOR;
        }
      }

      const userContext: UserContext = {
        id: user.id,
        username: user.name,
        role: role,
        is_active: true, // authService 已登录的用户默认为活跃
        force_password_change: user.forcePasswordChange,
        email: user.email,
      };

      // 记录审计日志
      await AuditLogger.log({
        user_id: user.id,
        username: user.name,
        event_type: AuditEventType.LOGIN_SUCCESS,
        action: '获取用户上下文',
        status: AuditEventStatus.SUCCESS,
      });

      return userContext;
    } catch (error) {
      console.error('获取用户上下文失败:', error);
      
      // 记录审计日志
      await AuditLogger.log({
        event_type: AuditEventType.LOGIN_FAILURE,
        action: '获取用户上下文失败',
        status: AuditEventStatus.FAILURE,
        error_message: error instanceof Error ? error.message : '未知错误',
      });
      
      return null;
    }
  }
}

/**
 * React Hook: 使用访问控制
 */
export function useAccessControl() {
  const [userContext, setUserContext] = React.useState<UserContext | null>(null);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    loadUserContext();
  }, []);

  const loadUserContext = async () => {
    setLoading(true);
    const context = await AccessControl.getCurrentUserContext();
    setUserContext(context);
    setLoading(false);
  };

  return {
    userContext,
    loading,
    hasPermission: (permission: Permission) =>
      userContext ? AccessControl.hasPermission(userContext, permission) : false,
    hasRole: (role: Role) =>
      userContext ? AccessControl.hasRole(userContext, role) : false,
    canCreateInventoryRecord: () =>
      userContext ? AccessControl.canCreateInventoryRecord(userContext) : { allowed: false },
    canUpdateInventoryRecord: (recordStatus: string) =>
      userContext ? AccessControl.canUpdateInventoryRecord(userContext, recordStatus) : { allowed: false },
    canDeleteInventoryRecord: () =>
      userContext ? AccessControl.canDeleteInventoryRecord(userContext) : { allowed: false },
    canApproveInventoryRecord: (recordStatus: string) =>
      userContext ? AccessControl.canApproveInventoryRecord(userContext, recordStatus) : { allowed: false },
    canManageUsers: () =>
      userContext ? AccessControl.canManageUsers(userContext) : { allowed: false },
    canExportData: () =>
      userContext ? AccessControl.canExportData(userContext) : { allowed: false },
  };
}

// 导入 React（如果文件顶部没有）
import React from 'react';
