/**
 * OpenSEC 安全规范驱动编程框架
 * 统一导出入口
 */

// 访问控制
export {
  AccessControl,
  Role,
  Permission,
  useAccessControl,
  type UserContext,
  type AccessControlResult,
} from './access-control';

// 输入验证
export {
  InputValidator,
  ValidateInput,
  type ValidationResult,
} from './input-validator';

// 审计日志
export {
  AuditLogger,
  AuditLog,
  AuditEventType,
  AuditEventStatus,
  type AuditLogEntry,
} from './audit-logger';
