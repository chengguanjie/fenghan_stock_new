/**
 * 审计日志工具函数
 * 用于记录系统中的关键操作
 */

import { authService } from "@/lib/auth";

export type AuditAction =
  | 'login'
  | 'logout'
  | 'create_user'
  | 'register_user'
  | 'update_user'
  | 'delete_user'
  | 'upload_excel'
  | 'create_inventory_record'
  | 'update_inventory_record'
  | 'submit_inventory'
  | 'change_password'
  | 'force_password_change'
  | 'create_admin'
  | 'access_denied';

export type ResourceType =
  | 'user'
  | 'profile'
  | 'inventory_item'
  | 'inventory_record'
  | 'auth'
  | 'system';

export type AuditStatus = 'success' | 'failure' | 'error';

export interface AuditLogParams {
  action: AuditAction;
  resourceType: ResourceType;
  resourceId?: string;
  details?: Record<string, any>;
  status?: AuditStatus;
  errorMessage?: string;
}

/**
 * 记录审计日志
 * 注意：此函数不会抛出错误，即使日志记录失败也不会影响主流程
 * TODO: 将来可以改为调用后端 API 记录审计日志
 */
export const logAudit = async (params: AuditLogParams): Promise<void> => {
  try {
    const user = authService.getCurrentUser();
    
    // 准备日志数据
    const logData = {
      user_id: user?.id || null,
      action: params.action,
      resource_type: params.resourceType,
      resource_id: params.resourceId || null,
      details: params.details || null,
      status: params.status || 'success',
      error_message: params.errorMessage || null,
      timestamp: new Date().toISOString(),
    };

    // 暂时只在控制台输出日志
    console.log('[审计日志]', logData);
    
    // TODO: 将来可以调用后端 API 记录审计日志
    // await apiClient.post('/audit-logs', logData);
  } catch (error) {
    // 捕获所有错误，确保不影响主流程
    console.error('审计日志异常:', error);
  }
};

/**
 * 记录登录日志
 */
export const logLogin = async (username: string, success: boolean, errorMessage?: string) => {
  await logAudit({
    action: 'login',
    resourceType: 'auth',
    details: { username },
    status: success ? 'success' : 'failure',
    errorMessage
  });
};

/**
 * 记录登出日志
 */
export const logLogout = async () => {
  await logAudit({
    action: 'logout',
    resourceType: 'auth',
    status: 'success'
  });
};

/**
 * 记录用户创建日志
 */
export const logUserCreation = async (userId: string, username: string, workshop: string) => {
  await logAudit({
    action: 'register_user',
    resourceType: 'user',
    resourceId: userId,
    details: { username, workshop },
    status: 'success'
  });
};

/**
 * 记录Excel上传日志
 */
export const logExcelUpload = async (itemCount: number, userCount: number, success: boolean, errorMessage?: string) => {
  await logAudit({
    action: 'upload_excel',
    resourceType: 'inventory_item',
    details: { itemCount, userCount },
    status: success ? 'success' : 'failure',
    errorMessage
  });
};

/**
 * 记录盘点记录创建/更新日志
 */
export const logInventoryRecord = async (
  recordId: string,
  itemId: string,
  quantity: number,
  isUpdate: boolean = false
) => {
  await logAudit({
    action: isUpdate ? 'update_inventory_record' : 'create_inventory_record',
    resourceType: 'inventory_record',
    resourceId: recordId,
    details: { itemId, quantity },
    status: 'success'
  });
};

/**
 * 记录盘点提交日志
 */
export const logInventorySubmit = async (recordCount: number) => {
  await logAudit({
    action: 'submit_inventory',
    resourceType: 'inventory_record',
    details: { recordCount },
    status: 'success'
  });
};

/**
 * 记录密码修改日志
 */
export const logPasswordChange = async (forced: boolean = false) => {
  await logAudit({
    action: forced ? 'force_password_change' : 'change_password',
    resourceType: 'auth',
    status: 'success'
  });
};

/**
 * 记录管理员创建日志
 */
export const logAdminCreation = async (adminId: string, adminName: string) => {
  await logAudit({
    action: 'create_admin',
    resourceType: 'user',
    resourceId: adminId,
    details: { adminName },
    status: 'success'
  });
};

/**
 * 记录访问拒绝日志
 */
export const logAccessDenied = async (resource: string, reason: string) => {
  await logAudit({
    action: 'access_denied',
    resourceType: 'system',
    details: { resource, reason },
    status: 'failure'
  });
};

