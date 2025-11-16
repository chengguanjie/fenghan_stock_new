# OpenSEC 安全规范驱动编程框架

## 概述

OpenSEC 是为凤韩食品库存盘点系统设计的安全规范驱动编程框架，提供完整的安全策略、访问控制、输入验证和审计日志系统。

## 核心组件

### 1. 安全策略配置 (security-policy.yaml)

定义系统的安全策略和规范：
- 认证策略：密码策略、会话管理
- 授权策略：角色定义、权限映射
- 数据保护：加密、脱敏、备份
- 审计日志：事件记录、日志保留
- 输入验证：字段级验证规则
- API 安全：速率限制、CORS
- 威胁防护：SQL注入、XSS、CSRF防护

### 2. 访问控制 (access-control.ts)

基于角色的访问控制（RBAC）实现。

**角色定义：**
- `admin` - 系统管理员（完全权限）
- `operator` - 盘点操作员（创建和查看）
- `viewer` - 只读用户（仅查看）

**使用示例：**
```typescript
import { AccessControl } from './opensec/access-control';

// 检查权限
const result = AccessControl.canCreateInventoryRecord(userContext);
if (result.allowed) {
  // 执行操作
} else {
  console.error(result.reason);
}
```

### 3. 输入验证器 (input-validator.ts)

提供数据验证和清洗功能。

**使用示例：**
```typescript
import { InputValidator } from './opensec/input-validator';

// 验证用户注册数据
const result = InputValidator.validateUserRegistration({
  username: 'testuser',
  password: 'SecurePass123',
  email: 'test@example.com'
});

if (result.success) {
  // 使用清洗后的数据
  const cleanData = result.data;
} else {
  // 显示错误
  console.error(result.errors);
}
```

### 4. 审计日志 (audit-logger.ts)

记录所有安全相关事件。

**使用示例：**
```typescript
import { AuditLogger } from './opensec/audit-logger';

// 记录登录成功
await AuditLogger.logLoginSuccess(userId, username, ipAddress);

// 记录权限被拒绝
await AuditLogger.logPermissionDenied(userId, username, action, reason);

// 查询日志
const logs = AuditLogger.getLogs({
  userId: 'user-id',
  startDate: new Date('2025-01-01'),
  limit: 100
});
```

## 快速开始

### 1. 在项目中集成访问控制

```typescript
// 在组件中使用
import { useAccessControl } from './opensec/access-control';

function InventoryPage() {
  const { userContext, canCreateInventoryRecord } = useAccessControl();
  
  const handleCreate = () => {
    const check = canCreateInventoryRecord();
    if (!check.allowed) {
      toast.error(check.reason);
      return;
    }
    // 执行创建操作
  };
}
```

### 2. 添加输入验证

```typescript
import { InputValidator } from './opensec/input-validator';

function handleSubmit(formData) {
  // 验证数据
  const validation = InputValidator.validateInventoryRecord(formData);
  
  if (!validation.success) {
    toast.error(validation.errors.join(', '));
    return;
  }
  
  // 使用验证后的数据
  await createRecord(validation.data);
}
```

### 3. 记录审计日志

```typescript
import { AuditLogger } from './opensec/audit-logger';

async function deleteRecord(recordId) {
  try {
    await supabase.from('inventory_records').delete().eq('id', recordId);
    
    // 记录审计日志
    await AuditLogger.logRecordDeleted(
      userContext.id,
      userContext.username,
      'inventory_record',
      recordId
    );
  } catch (error) {
    // 错误处理
  }
}
```

## 安全最佳实践

### 1. 始终验证用户权限

在执行任何敏感操作前，使用 `AccessControl` 检查权限：

```typescript
const check = AccessControl.canDeleteInventoryRecord(userContext);
if (!check.allowed) {
  throw new Error(check.reason);
}
```

### 2. 验证所有用户输入

使用 `InputValidator` 验证和清洗所有用户输入：

```typescript
const validation = InputValidator.validateUserRegistration(data);
if (!validation.success) {
  return { error: validation.errors };
}
```

### 3. 记录重要操作

使用 `AuditLogger` 记录所有安全相关事件：

```typescript
await AuditLogger.logRecordCreated(userId, username, 'inventory', recordId);
```

### 4. 防止常见攻击

- **SQL 注入**：使用参数化查询（Supabase 自动处理）
- **XSS**：使用 `InputValidator.sanitizeString()` 清洗输入
- **CSRF**：使用 Supabase 的内置 CSRF 保护
- **暴力破解**：实施登录尝试限制

## 配置说明

### 修改安全策略

编辑 `security-policy.yaml` 文件来调整安全策略：

```yaml
# 修改密码策略
authentication:
  password_policy:
    min_length: 10  # 最小长度改为10
    require_special_chars: true  # 要求特殊字符
```

### 添加新角色

在 `access-control.ts` 中添加新角色：

```typescript
export enum Role {
  ADMIN = 'admin',
  OPERATOR = 'operator',
  VIEWER = 'viewer',
  AUDITOR = 'auditor',  // 新角色
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  [Role.AUDITOR]: [
    Permission.INVENTORY_READ,
    Permission.REPORT_READ,
    // 审计员权限
  ],
};
```

## 合规性

该框架遵循以下安全标准：
- ISO 27001 信息安全管理
- OWASP Top 10 Web 应用安全风险

## 维护和更新

### 定期审查

- 每季度审查安全策略配置
- 每月检查审计日志异常
- 及时更新依赖包

### 监控指标

- 登录失败率
- 权限拒绝次数
- API 错误率
- 异常数据访问

## 故障排查

### 权限检查失败

检查用户状态和角色配置：
```typescript
console.log('User Context:', userContext);
console.log('Has Permission:', AccessControl.hasPermission(userContext, Permission.INVENTORY_CREATE));
```

### 输入验证失败

查看详细错误信息：
```typescript
const result = InputValidator.validateInventoryRecord(data);
console.log('Validation Errors:', result.errors);
```

### 审计日志未记录

确保在操作完成后调用日志记录：
```typescript
try {
  await performOperation();
  await AuditLogger.logRecordCreated(...);
} catch (error) {
  await AuditLogger.log({
    event_type: AuditEventType.RECORD_CREATED,
    status: AuditEventStatus.FAILURE,
    error_message: error.message
  });
}
```

## 支持

如有问题或建议，请联系技术团队。
