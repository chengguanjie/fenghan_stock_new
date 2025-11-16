/**
 * OpenSEC 使用示例
 * 展示如何在实际项目中使用安全规范框架
 */

import { AccessControl, Role, Permission } from './access-control';
import { InputValidator } from './input-validator';
import { AuditLogger, AuditEventType } from './audit-logger';

// ============================================
// 示例 1: 访问控制检查
// ============================================

export async function exampleAccessControl() {
  // 获取当前用户上下文
  const userContext = await AccessControl.getCurrentUserContext();
  
  if (!userContext) {
    console.error('用户未登录');
    return;
  }

  // 检查是否可以创建盘点记录
  const canCreate = AccessControl.canCreateInventoryRecord(userContext);
  if (canCreate.allowed) {
    console.log('✅ 用户可以创建盘点记录');
  } else {
    console.log('❌ 权限被拒绝:', canCreate.reason);
  }

  // 检查是否有特定权限
  if (AccessControl.hasPermission(userContext, Permission.INVENTORY_APPROVE)) {
    console.log('✅ 用户有审核权限');
  }

  // 检查是否是管理员
  if (AccessControl.hasRole(userContext, Role.ADMIN)) {
    console.log('✅ 用户是管理员');
  }
}

// ============================================
// 示例 2: 输入验证
// ============================================

export function exampleInputValidation() {
  // 验证用户注册数据
  const registrationData = {
    username: 'testuser',
    password: 'SecurePass123',
    email: 'test@example.com',
    phone: '13800138000',
  };

  const validation = InputValidator.validateUserRegistration(registrationData);
  
  if (validation.success) {
    console.log('✅ 验证通过:', validation.data);
  } else {
    console.error('❌ 验证失败:', validation.errors);
  }

  // 验证盘点记录数据
  const inventoryData = {
    product_code: 'P001',
    product_name: '商品A',
    category: '食品',
    unit: '箱',
    system_quantity: 100,
    actual_quantity: 95,
    location: '仓库A-01',
    notes: '盘点正常',
  };

  const inventoryValidation = InputValidator.validateInventoryRecord(inventoryData);
  
  if (inventoryValidation.success) {
    console.log('✅ 盘点数据验证通过');
    console.log('差异:', inventoryValidation.data?.difference);
  }
}

// ============================================
// 示例 3: 数据清洗
// ============================================

export function exampleDataSanitization() {
  // 清洗用户输入（防止 XSS）
  const userInput = '<script>alert("XSS")</script>Hello';
  const sanitized = InputValidator.sanitizeString(userInput);
  console.log('原始输入:', userInput);
  console.log('清洗后:', sanitized);

  // 安全检查
  const dangerousInput = "'; DROP TABLE users; --";
  const securityCheck = InputValidator.performSecurityCheck(dangerousInput);
  
  if (!securityCheck.success) {
    console.error('⚠️ 检测到安全风险:', securityCheck.errors);
  }
}

// ============================================
// 示例 4: 审计日志记录
// ============================================

export async function exampleAuditLogging() {
  const userId = 'user-123';
  const username = 'testuser';

  // 记录登录成功
  await AuditLogger.logLoginSuccess(userId, username, '192.168.1.100');

  // 记录创建记录
  await AuditLogger.logRecordCreated(
    userId,
    username,
    'inventory_record',
    'record-456'
  );

  // 记录权限被拒绝
  await AuditLogger.logPermissionDenied(
    userId,
    username,
    '删除盘点记录',
    '只有管理员可以删除记录'
  );

  // 查询日志
  const logs = AuditLogger.getLogs({
    userId: userId,
    limit: 10,
  });

  console.log('最近的审计日志:', logs);
}

// ============================================
// 示例 5: 完整的创建盘点记录流程
// ============================================

export async function exampleCreateInventoryRecord(formData: Record<string, unknown>) {
  try {
    // 1. 获取用户上下文
    const userContext = await AccessControl.getCurrentUserContext();
    if (!userContext) {
      throw new Error('用户未登录');
    }

    // 2. 检查权限
    const accessCheck = AccessControl.canCreateInventoryRecord(userContext);
    if (!accessCheck.allowed) {
      await AuditLogger.logPermissionDenied(
        userContext.id,
        userContext.username,
        '创建盘点记录',
        accessCheck.reason || '权限不足'
      );
      throw new Error(accessCheck.reason);
    }

    // 3. 验证输入数据
    const validation = InputValidator.validateInventoryRecord(formData);
    if (!validation.success) {
      throw new Error(validation.errors?.join(', '));
    }

    // 4. 创建记录（这里应该调用实际的数据库操作）
    const recordId = 'new-record-id';
    console.log('创建记录:', validation.data);

    // 5. 记录审计日志
    await AuditLogger.logRecordCreated(
      userContext.id,
      userContext.username,
      'inventory_record',
      recordId
    );

    return {
      success: true,
      recordId,
      message: '盘点记录创建成功',
    };
  } catch (error) {
    console.error('创建盘点记录失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

// ============================================
// 示例 6: 完整的审核流程
// ============================================

export async function exampleApproveInventoryRecord(
  recordId: string,
  recordStatus: string,
  reviewNotes?: string
) {
  try {
    // 1. 获取用户上下文
    const userContext = await AccessControl.getCurrentUserContext();
    if (!userContext) {
      throw new Error('用户未登录');
    }

    // 2. 检查审核权限
    const accessCheck = AccessControl.canApproveInventoryRecord(
      userContext,
      recordStatus
    );
    
    if (!accessCheck.allowed) {
      await AuditLogger.logPermissionDenied(
        userContext.id,
        userContext.username,
        '审核盘点记录',
        accessCheck.reason || '权限不足'
      );
      throw new Error(accessCheck.reason);
    }

    // 3. 验证审核数据
    const validation = InputValidator.validateInventoryApproval({
      record_id: recordId,
      status: 'approved',
      review_notes: reviewNotes,
    });

    if (!validation.success) {
      throw new Error(validation.errors?.join(', '));
    }

    // 4. 执行审核（这里应该调用实际的数据库操作）
    console.log('审核记录:', validation.data);

    // 5. 记录审计日志
    await AuditLogger.logRecordApproved(
      userContext.id,
      userContext.username,
      recordId
    );

    return {
      success: true,
      message: '审核成功',
    };
  } catch (error) {
    console.error('审核失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

// ============================================
// 示例 7: 数据导出流程
// ============================================

export async function exampleExportData(exportType: string, recordCount: number) {
  try {
    // 1. 获取用户上下文
    const userContext = await AccessControl.getCurrentUserContext();
    if (!userContext) {
      throw new Error('用户未登录');
    }

    // 2. 检查导出权限
    const accessCheck = AccessControl.canExportData(userContext);
    if (!accessCheck.allowed) {
      await AuditLogger.logPermissionDenied(
        userContext.id,
        userContext.username,
        '导出数据',
        accessCheck.reason || '权限不足'
      );
      throw new Error(accessCheck.reason);
    }

    // 3. 执行导出（这里应该调用实际的导出逻辑）
    console.log(`导出 ${recordCount} 条 ${exportType} 数据`);

    // 4. 记录审计日志
    await AuditLogger.logDataExported(
      userContext.id,
      userContext.username,
      exportType,
      recordCount
    );

    return {
      success: true,
      message: '数据导出成功',
    };
  } catch (error) {
    console.error('导出失败:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : '未知错误',
    };
  }
}

// ============================================
// 示例 8: React 组件中使用
// ============================================

/*
import { useAccessControl } from './opensec/access-control';
import { InputValidator } from './opensec/input-validator';
import { AuditLogger } from './opensec/audit-logger';

function InventoryRecordForm() {
  const { userContext, canCreateInventoryRecord } = useAccessControl();
  const [formData, setFormData] = useState({});

  const handleSubmit = async (e) => {
    e.preventDefault();

    // 检查权限
    const accessCheck = canCreateInventoryRecord();
    if (!accessCheck.allowed) {
      toast.error(accessCheck.reason);
      return;
    }

    // 验证输入
    const validation = InputValidator.validateInventoryRecord(formData);
    if (!validation.success) {
      toast.error(validation.errors.join(', '));
      return;
    }

    // 创建记录
    try {
      const result = await createRecord(validation.data);
      
      // 记录审计日志
      await AuditLogger.logRecordCreated(
        userContext.id,
        userContext.username,
        'inventory_record',
        result.id
      );
      
      toast.success('创建成功');
    } catch (error) {
      toast.error('创建失败');
    }
  };

  return (
    <form onSubmit={handleSubmit}>
      // 表单内容
    </form>
  );
}
*/
