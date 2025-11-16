/**
 * 统一错误处理工具
 * 防止敏感信息泄露，提供用户友好的错误信息
 */

/**
 * 用户友好的错误信息映射
 */
const ERROR_MESSAGES: Record<string, string> = {
  // 认证相关
  'Invalid login credentials': '用户名或密码错误',
  'User not found': '用户不存在',
  'Email not confirmed': '邮箱未验证',
  'Invalid API key': '系统配置错误，请联系管理员',
  
  // 数据库相关
  'duplicate key value': '数据已存在',
  'violates foreign key constraint': '相关数据不存在',
  'violates not-null constraint': '必填字段不能为空',
  'permission denied': '权限不足',
  
  // 网络相关
  'Failed to fetch': '网络连接失败，请检查网络',
  'NetworkError': '网络错误，请稍后重试',
  'timeout': '请求超时，请重试',
  
  // 通用错误
  'Unknown error': '未知错误，请联系管理员',
};

/**
 * 不应该暴露给用户的敏感错误模式
 */
const SENSITIVE_PATTERNS = [
  /password/i,
  /token/i,
  /secret/i,
  /key/i,
  /SELECT.*FROM/i,
  /INSERT.*INTO/i,
  /UPDATE.*SET/i,
  /DELETE.*FROM/i,
  /CREATE.*TABLE/i,
  /ALTER.*TABLE/i,
  /DROP.*TABLE/i,
];

/**
 * 检查错误信息是否包含敏感信息
 */
const containsSensitiveInfo = (message: string): boolean => {
  return SENSITIVE_PATTERNS.some(pattern => pattern.test(message));
};

/**
 * 将技术错误转换为用户友好的错误信息
 */
export const getUserFriendlyError = (error: any): string => {
  // 如果是string类型
  if (typeof error === 'string') {
    // 检查是否包含敏感信息
    if (containsSensitiveInfo(error)) {
      return '操作失败，请联系管理员';
    }
    
    // 查找匹配的友好信息
    for (const [key, message] of Object.entries(ERROR_MESSAGES)) {
      if (error.includes(key)) {
        return message;
      }
    }
    
    return error;
  }
  
  // 如果是Error对象
  if (error instanceof Error) {
    const message = error.message;
    
    // 检查是否包含敏感信息
    if (containsSensitiveInfo(message)) {
      console.error('敏感错误（已过滤）:', message);
      return '操作失败，请联系管理员';
    }
    
    // 查找匹配的友好信息
    for (const [key, friendlyMessage] of Object.entries(ERROR_MESSAGES)) {
      if (message.includes(key)) {
        return friendlyMessage;
      }
    }
    
    return message;
  }
  
  // 如果是对象且包含message字段
  if (error && typeof error === 'object' && 'message' in error) {
    return getUserFriendlyError(error.message);
  }
  
  // 默认错误信息
  return '操作失败，请稍后重试';
};

/**
 * 记录错误到控制台（开发环境）或发送到监控服务（生产环境）
 */
export const logError = (error: any, context?: string) => {
  const isDevelopment = import.meta.env.DEV;
  
  if (isDevelopment) {
    console.group(`❌ 错误${context ? ` [${context}]` : ''}`);
    console.error('错误详情:', error);
    if (error instanceof Error && error.stack) {
      console.error('堆栈跟踪:', error.stack);
    }
    console.groupEnd();
  } else {
    // 生产环境：只记录必要信息，不暴露敏感数据
    console.error(`错误 [${context || 'Unknown'}]:`, getUserFriendlyError(error));
    
    // TODO: 这里可以集成错误监控服务（如 Sentry）
    // 例如：Sentry.captureException(error, { tags: { context } });
  }
};

/**
 * 处理异步操作的错误
 * 返回 [error, data] 元组
 */
export const handleAsync = async <T>(
  promise: Promise<T>
): Promise<[null, T] | [Error, null]> => {
  try {
    const data = await promise;
    return [null, data];
  } catch (error) {
    logError(error);
    return [error instanceof Error ? error : new Error(String(error)), null];
  }
};

/**
 * 全局错误边界处理
 */
export class ErrorBoundary {
  static handle(error: Error, errorInfo: any) {
    logError(error, 'React Error Boundary');
    console.error('组件错误信息:', errorInfo);
    
    // TODO: 发送到错误监控服务
  }
}

