/**
 * 输入清理和验证工具
 * 防止 XSS 和 SQL 注入攻击
 */

/**
 * 清理用户名输入
 */
export function sanitizeName(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '') // 移除潜在的 XSS 字符
    .substring(0, 100); // 限制长度
}

/**
 * 清理车间名称
 */
export function sanitizeWorkshop(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '')
    .substring(0, 100);
}

/**
 * 清理物料名称
 */
export function sanitizeMaterialName(input: string): string {
  return input
    .trim()
    .replace(/[<>\"'&]/g, '')
    .substring(0, 255);
}

/**
 * 验证输入安全性
 */
export function validateInputSecurity(input: string): {
  isValid: boolean;
  error?: string;
} {
  // 检查 SQL 注入模式
  const sqlInjectionPatterns = [
    /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
    /(union.*select)/i,
    /(--|;|\/\*|\*\/)/,
  ];

  for (const pattern of sqlInjectionPatterns) {
    if (pattern.test(input)) {
      return {
        isValid: false,
        error: '包含非法字符或SQL注入特征',
      };
    }
  }

  // 检查 XSS 模式
  const xssPatterns = [
    /<script/i,
    /javascript:/i,
    /on\w+\s*=/i, // 事件处理器
  ];

  for (const pattern of xssPatterns) {
    if (pattern.test(input)) {
      return {
        isValid: false,
        error: '包含潜在的XSS攻击特征',
      };
    }
  }

  return { isValid: true };
}


