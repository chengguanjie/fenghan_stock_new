/**
 * OpenSEC 审计日志系统
 * 记录所有安全相关事件
 */

export enum AuditEventType {
  // 认证事件
  LOGIN_SUCCESS = 'login_success',
  LOGIN_FAILURE = 'login_failure',
  LOGOUT = 'logout',
  PASSWORD_CHANGE = 'password_change',
  PASSWORD_RESET = 'password_reset',
  ACCOUNT_LOCKED = 'account_locked',
  
  // 授权事件
  PERMISSION_DENIED = 'permission_denied',
  ROLE_CHANGED = 'role_changed',
  
  // 数据访问事件
  RECORD_CREATED = 'record_created',
  RECORD_UPDATED = 'record_updated',
  RECORD_DELETED = 'record_deleted',
  RECORD_APPROVED = 'record_approved',
  RECORD_REJECTED = 'record_rejected',
  DATA_EXPORTED = 'data_exported',
  
  // 系统事件
  CONFIG_CHANGED = 'config_changed',
  USER_CREATED = 'user_created',
  USER_DELETED = 'user_deleted',
  USER_DEACTIVATED = 'user_deactivated',
}

export enum AuditEventStatus {
  SUCCESS = 'success',
  FAILURE = 'failure',
  WARNING = 'warning',
}

export interface AuditLogEntry {
  id?: string;
  timestamp: Date;
  user_id?: string;
  username?: string;
  ip_address?: string;
  user_agent?: string;
  event_type: AuditEventType;
  resource_type?: string;
  resource_id?: string;
  action: string;
  status: AuditEventStatus;
  error_message?: string;
  metadata?: Record<string, unknown>;
}

/**
 * 审计日志记录器
 */
export class AuditLogger {
  private static logs: AuditLogEntry[] = [];
  private static readonly MAX_LOGS_IN_MEMORY = 1000;

  /**
   * 记录审计日志
   */
  static async log(entry: Omit<AuditLogEntry, 'id' | 'timestamp'>): Promise<void> {
    const logEntry: AuditLogEntry = {
      id: this.generateId(),
      timestamp: new Date(),
      ...entry,
    };

    // 添加到内存日志
    this.logs.push(logEntry);
    
    // 限制内存中的日志数量
    if (this.logs.length > this.MAX_LOGS_IN_MEMORY) {
      this.logs.shift();
    }

    // 输出到控制台（开发环境）
    if (import.meta.env.DEV) {
      console.log('[AUDIT]', logEntry);
    }

    // 在生产环境中，这里应该将日志发送到后端
    // await this.sendToBackend(logEntry);
  }

  /**
   * 记录登录成功
   */
  static async logLoginSuccess(userId: string, username: string, ipAddress?: string): Promise<void> {
    await this.log({
      user_id: userId,
      username,
      ip_address: ipAddress,
      event_type: AuditEventType.LOGIN_SUCCESS,
      action: '用户登录成功',
      status: AuditEventStatus.SUCCESS,
    });
  }

  /**
   * 记录登录失败
   */
  static async logLoginFailure(username: string, reason: string, ipAddress?: string): Promise<void> {
    await this.log({
      username,
      ip_address: ipAddress,
      event_type: AuditEventType.LOGIN_FAILURE,
      action: '用户登录失败',
      status: AuditEventStatus.FAILURE,
      error_message: reason,
    });
  }

  /**
   * 记录登出
   */
  static async logLogout(userId: string, username: string): Promise<void> {
    await this.log({
      user_id: userId,
      username,
      event_type: AuditEventType.LOGOUT,
      action: '用户登出',
      status: AuditEventStatus.SUCCESS,
    });
  }

  /**
   * 记录密码修改
   */
  static async logPasswordChange(userId: string, username: string): Promise<void> {
    await this.log({
      user_id: userId,
      username,
      event_type: AuditEventType.PASSWORD_CHANGE,
      action: '用户修改密码',
      status: AuditEventStatus.SUCCESS,
    });
  }

  /**
   * 记录权限被拒绝
   */
  static async logPermissionDenied(
    userId: string,
    username: string,
    action: string,
    reason: string
  ): Promise<void> {
    await this.log({
      user_id: userId,
      username,
      event_type: AuditEventType.PERMISSION_DENIED,
      action: `权限被拒绝: ${action}`,
      status: AuditEventStatus.FAILURE,
      error_message: reason,
    });
  }

  /**
   * 记录角色变更
   */
  static async logRoleChanged(
    userId: string,
    username: string,
    oldRole: string,
    newRole: string
  ): Promise<void> {
    await this.log({
      user_id: userId,
      username,
      event_type: AuditEventType.ROLE_CHANGED,
      action: '用户角色变更',
      status: AuditEventStatus.SUCCESS,
      metadata: {
        old_role: oldRole,
        new_role: newRole,
      },
    });
  }

  /**
   * 记录记录创建
   */
  static async logRecordCreated(
    userId: string,
    username: string,
    resourceType: string,
    resourceId: string
  ): Promise<void> {
    await this.log({
      user_id: userId,
      username,
      event_type: AuditEventType.RECORD_CREATED,
      resource_type: resourceType,
      resource_id: resourceId,
      action: `创建${resourceType}记录`,
      status: AuditEventStatus.SUCCESS,
    });
  }

  /**
   * 记录记录更新
   */
  static async logRecordUpdated(
    userId: string,
    username: string,
    resourceType: string,
    resourceId: string,
    changes?: Record<string, unknown>
  ): Promise<void> {
    await this.log({
      user_id: userId,
      username,
      event_type: AuditEventType.RECORD_UPDATED,
      resource_type: resourceType,
      resource_id: resourceId,
      action: `更新${resourceType}记录`,
      status: AuditEventStatus.SUCCESS,
      metadata: changes,
    });
  }

  /**
   * 记录记录删除
   */
  static async logRecordDeleted(
    userId: string,
    username: string,
    resourceType: string,
    resourceId: string
  ): Promise<void> {
    await this.log({
      user_id: userId,
      username,
      event_type: AuditEventType.RECORD_DELETED,
      resource_type: resourceType,
      resource_id: resourceId,
      action: `删除${resourceType}记录`,
      status: AuditEventStatus.SUCCESS,
    });
  }

  /**
   * 记录记录审核
   */
  static async logRecordApproved(
    userId: string,
    username: string,
    resourceId: string
  ): Promise<void> {
    await this.log({
      user_id: userId,
      username,
      event_type: AuditEventType.RECORD_APPROVED,
      resource_type: 'inventory_record',
      resource_id: resourceId,
      action: '审核通过盘点记录',
      status: AuditEventStatus.SUCCESS,
    });
  }

  /**
   * 记录记录拒绝
   */
  static async logRecordRejected(
    userId: string,
    username: string,
    resourceId: string,
    reason?: string
  ): Promise<void> {
    await this.log({
      user_id: userId,
      username,
      event_type: AuditEventType.RECORD_REJECTED,
      resource_type: 'inventory_record',
      resource_id: resourceId,
      action: '拒绝盘点记录',
      status: AuditEventStatus.SUCCESS,
      error_message: reason,
    });
  }

  /**
   * 记录数据导出
   */
  static async logDataExported(
    userId: string,
    username: string,
    exportType: string,
    recordCount: number
  ): Promise<void> {
    await this.log({
      user_id: userId,
      username,
      event_type: AuditEventType.DATA_EXPORTED,
      action: `导出${exportType}数据`,
      status: AuditEventStatus.SUCCESS,
      metadata: {
        export_type: exportType,
        record_count: recordCount,
      },
    });
  }

  /**
   * 记录用户创建
   */
  static async logUserCreated(
    adminId: string,
    adminUsername: string,
    newUserId: string,
    newUsername: string
  ): Promise<void> {
    await this.log({
      user_id: adminId,
      username: adminUsername,
      event_type: AuditEventType.USER_CREATED,
      resource_type: 'user',
      resource_id: newUserId,
      action: `创建新用户: ${newUsername}`,
      status: AuditEventStatus.SUCCESS,
    });
  }

  /**
   * 记录用户删除
   */
  static async logUserDeleted(
    adminId: string,
    adminUsername: string,
    deletedUserId: string,
    deletedUsername: string
  ): Promise<void> {
    await this.log({
      user_id: adminId,
      username: adminUsername,
      event_type: AuditEventType.USER_DELETED,
      resource_type: 'user',
      resource_id: deletedUserId,
      action: `删除用户: ${deletedUsername}`,
      status: AuditEventStatus.SUCCESS,
    });
  }

  /**
   * 获取日志
   */
  static getLogs(filter?: {
    userId?: string;
    eventType?: AuditEventType;
    startDate?: Date;
    endDate?: Date;
    limit?: number;
  }): AuditLogEntry[] {
    let filtered = [...this.logs];

    if (filter) {
      if (filter.userId) {
        filtered = filtered.filter(log => log.user_id === filter.userId);
      }
      if (filter.eventType) {
        filtered = filtered.filter(log => log.event_type === filter.eventType);
      }
      if (filter.startDate) {
        filtered = filtered.filter(log => log.timestamp >= filter.startDate!);
      }
      if (filter.endDate) {
        filtered = filtered.filter(log => log.timestamp <= filter.endDate!);
      }
      if (filter.limit) {
        filtered = filtered.slice(-filter.limit);
      }
    }

    return filtered.sort((a, b) => b.timestamp.getTime() - a.timestamp.getTime());
  }

  /**
   * 清除日志（仅用于测试）
   */
  static clearLogs(): void {
    this.logs = [];
  }

  /**
   * 生成唯一ID
   */
  private static generateId(): string {
    return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * 获取客户端IP地址
   */
  static getClientIP(): string | undefined {
    // 在浏览器环境中无法直接获取IP，需要从后端API获取
    // 这里返回 undefined，实际应用中应该从后端获取
    return undefined;
  }

  /**
   * 获取用户代理
   */
  static getUserAgent(): string {
    return navigator.userAgent;
  }
}

/**
 * 审计日志装饰器
 */
export function AuditLog(eventType: AuditEventType, action: string) {
  return function (
    target: unknown,
    propertyKey: string,
    descriptor: PropertyDescriptor
  ) {
    const originalMethod = descriptor.value;

    descriptor.value = async function (this: { userId?: string; username?: string }, ...args: unknown[]) {
      const startTime = Date.now();
      let status = AuditEventStatus.SUCCESS;
      let errorMessage: string | undefined;

      try {
        const result = await originalMethod.apply(this, args);
        return result;
      } catch (error) {
        status = AuditEventStatus.FAILURE;
        errorMessage = error instanceof Error ? error.message : '未知错误';
        throw error;
      } finally {
        const duration = Date.now() - startTime;
        
        await AuditLogger.log({
          user_id: this.userId,
          username: this.username,
          event_type: eventType,
          action,
          status,
          error_message: errorMessage,
          metadata: {
            duration_ms: duration,
            method: propertyKey,
          },
        });
      }
    };

    return descriptor;
  };
}
