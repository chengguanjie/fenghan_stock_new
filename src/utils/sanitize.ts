/**
 * 输入清理和XSS防护工具函数
 */

/**
 * 清理HTML标签，防止XSS攻击
 * 移除所有HTML标签和危险字符
 */
export const sanitizeHTML = (input: string): string => {
  if (!input) return '';
  
  // 移除所有HTML标签
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // 转义特殊字符
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  return sanitized.trim();
};

/**
 * 清理用户名输入
 * 只允许中文、英文字母、数字和常见标点
 */
export const sanitizeName = (input: string): string => {
  if (!input) return '';
  
  // 移除HTML标签
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // 只保留中文、英文字母、数字、空格和常见标点
  sanitized = sanitized.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s\-_·]/g, '');
  
  // 限制长度
  if (sanitized.length > 50) {
    sanitized = sanitized.substring(0, 50);
  }
  
  return sanitized.trim();
};

/**
 * 清理数字输入
 * 只允许数字和小数点
 */
export const sanitizeNumber = (input: string): string => {
  if (!input) return '';
  
  // 只保留数字和小数点
  let sanitized = input.replace(/[^0-9.]/g, '');
  
  // 确保只有一个小数点
  const parts = sanitized.split('.');
  if (parts.length > 2) {
    sanitized = parts[0] + '.' + parts.slice(1).join('');
  }
  
  return sanitized;
};

/**
 * 清理文本输入（通用）
 * 移除危险字符，但保留常用字符
 */
export const sanitizeText = (input: string, maxLength: number = 200): string => {
  if (!input) return '';
  
  // 移除HTML标签
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // 移除控制字符（但保留换行和制表符）
  sanitized = sanitized.replace(/[\x00-\x08\x0B\x0C\x0E-\x1F\x7F]/g, '');
  
  // 限制长度
  if (sanitized.length > maxLength) {
    sanitized = sanitized.substring(0, maxLength);
  }
  
  return sanitized.trim();
};

/**
 * 验证和清理工作车间名称
 */
export const sanitizeWorkshop = (input: string): string => {
  return sanitizeName(input);
};

/**
 * 验证和清理区域名称
 */
export const sanitizeArea = (input: string): string => {
  return sanitizeName(input);
};

/**
 * 验证和清理物料名称
 */
export const sanitizeMaterialName = (input: string): string => {
  if (!input) return '';
  
  // 允许更多字符用于物料名称
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // 保留中文、英文、数字、常见标点和括号
  sanitized = sanitized.replace(/[^\u4e00-\u9fa5a-zA-Z0-9\s\-_·()（）【】,，./、]/g, '');
  
  // 限制长度
  if (sanitized.length > 100) {
    sanitized = sanitized.substring(0, 100);
  }
  
  return sanitized.trim();
};

/**
 * 验证邮箱格式
 */
export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[a-zA-Z0-9._-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email);
};

/**
 * 检查字符串是否包含SQL注入特征
 */
export const containsSQLInjection = (input: string): boolean => {
  const sqlPatterns = [
    /(\bSELECT\b|\bINSERT\b|\bUPDATE\b|\bDELETE\b|\bDROP\b|\bCREATE\b|\bALTER\b)/i,
    /(\bUNION\b.*\bSELECT\b)/i,
    /(;.*--|\/\*|\*\/)/,
    /(\bOR\b.*=.*|'.*OR.*'.*=.*')/i
  ];
  
  return sqlPatterns.some(pattern => pattern.test(input));
};

/**
 * 检查字符串是否包含XSS特征
 */
export const containsXSS = (input: string): boolean => {
  const xssPatterns = [
    /<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi,
    /javascript:/gi,
    /on\w+\s*=/gi, // onclick, onload等
    /<iframe/gi,
    /<object/gi,
    /<embed/gi
  ];
  
  return xssPatterns.some(pattern => pattern.test(input));
};

/**
 * 验证输入安全性
 * 返回是否安全以及错误信息
 */
export const validateInputSecurity = (input: string): { isValid: boolean; error?: string } => {
  if (containsSQLInjection(input)) {
    return { isValid: false, error: '输入包含非法字符' };
  }
  
  if (containsXSS(input)) {
    return { isValid: false, error: '输入包含非法内容' };
  }
  
  return { isValid: true };
};

