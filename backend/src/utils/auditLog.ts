import { PrismaClient, AuditStatus } from '@prisma/client';

const prisma = new PrismaClient();

/**
 * 审计日志工具
 */

export interface CreateAuditLogParams {
  userId?: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  details?: any;
  ipAddress?: string;
  userAgent?: string;
  status?: AuditStatus;
  errorMessage?: string;
}

/**
 * 创建审计日志
 */
export async function createAuditLog(params: CreateAuditLogParams) {
  try {
    await prisma.auditLog.create({
      data: {
        userId: params.userId || null,
        action: params.action,
        resourceType: params.resourceType,
        resourceId: params.resourceId || null,
        details: params.details || null,
        ipAddress: params.ipAddress || null,
        userAgent: params.userAgent || null,
        status: params.status || 'success',
        errorMessage: params.errorMessage || null,
      },
    });
  } catch (error) {
    console.error('创建审计日志失败：', error);
    // 审计日志失败不应阻塞主业务
  }
}

/**
 * 记录审计日志（通用函数）
 * 别名函数，用于兼容其他模块
 */
export const logAudit = createAuditLog;

/**
 * 记录登录日志
 */
export async function logLogin(
  name: string,
  success: boolean,
  userId?: string,
  ipAddress?: string,
  userAgent?: string,
  errorMessage?: string
) {
  await createAuditLog({
    userId,
    action: 'login',
    resourceType: 'user',
    resourceId: name,
    status: success ? 'success' : 'failure',
    ipAddress,
    userAgent,
    errorMessage,
  });
}

/**
 * 记录用户创建日志
 */
export async function logUserCreate(
  adminId: string,
  newUserName: string,
  ipAddress?: string,
  userAgent?: string
) {
  await createAuditLog({
    userId: adminId,
    action: 'create_user',
    resourceType: 'user',
    resourceId: newUserName,
    ipAddress,
    userAgent,
  });
}

/**
 * 记录密码修改日志
 */
export async function logPasswordChange(
  userId: string,
  ipAddress?: string,
  userAgent?: string
) {
  await createAuditLog({
    userId,
    action: 'change_password',
    resourceType: 'user',
    resourceId: userId,
    ipAddress,
    userAgent,
  });
}

/**
 * 记录 Excel 上传日志
 */
export async function logExcelUpload(
  adminId: string,
  itemCount: number,
  userCount: number,
  ipAddress?: string,
  userAgent?: string
) {
  await createAuditLog({
    userId: adminId,
    action: 'upload_excel',
    resourceType: 'inventory_item',
    details: {
      itemCount,
      userCount,
    },
    ipAddress,
    userAgent,
  });
}

/**
 * 记录盘点提交日志
 */
export async function logInventorySubmit(
  userId: string,
  recordId: string,
  ipAddress?: string,
  userAgent?: string
) {
  await createAuditLog({
    userId,
    action: 'submit_inventory',
    resourceType: 'inventory_record',
    resourceId: recordId,
    ipAddress,
    userAgent,
  });
}


