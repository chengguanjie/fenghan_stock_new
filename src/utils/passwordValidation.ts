/**
 * 密码验证工具函数
 */

export interface PasswordValidationResult {
  isValid: boolean;
  errors: string[];
}

/**
 * 验证密码强度
 * 要求：
 * - 至少8位
 * - 包含大写字母
 * - 包含小写字母
 * - 包含数字
 */
export const validatePasswordStrength = (password: string): PasswordValidationResult => {
  const errors: string[] = [];

  if (!password) {
    return {
      isValid: false,
      errors: ['密码不能为空']
    };
  }

  if (password.length < 8) {
    errors.push('密码至少需要8位');
  }

  if (!/[A-Z]/.test(password)) {
    errors.push('密码必须包含至少一个大写字母');
  }

  if (!/[a-z]/.test(password)) {
    errors.push('密码必须包含至少一个小写字母');
  }

  if (!/[0-9]/.test(password)) {
    errors.push('密码必须包含至少一个数字');
  }

  // 可选：检查特殊字符（暂不强制要求）
  // if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
  //   errors.push('密码必须包含至少一个特殊字符');
  // }

  return {
    isValid: errors.length === 0,
    errors
  };
};

/**
 * 检查密码是否过于简单
 */
export const isCommonPassword = (password: string): boolean => {
  const commonPasswords = [
    '12345678',
    'password',
    'Password1',
    'Aa123456',
    '11111111',
    '88888888',
    'qwerty123',
    'Qwerty123'
  ];

  return commonPasswords.includes(password);
};

/**
 * 验证两次输入的密码是否一致
 */
export const validatePasswordMatch = (password: string, confirmPassword: string): boolean => {
  return password === confirmPassword;
};

/**
 * 完整的密码验证
 */
export const validatePassword = (
  password: string, 
  confirmPassword: string
): PasswordValidationResult => {
  const strengthResult = validatePasswordStrength(password);
  
  if (!strengthResult.isValid) {
    return strengthResult;
  }

  if (isCommonPassword(password)) {
    return {
      isValid: false,
      errors: ['该密码过于简单，请使用更复杂的密码']
    };
  }

  if (!validatePasswordMatch(password, confirmPassword)) {
    return {
      isValid: false,
      errors: ['两次输入的密码不一致']
    };
  }

  return {
    isValid: true,
    errors: []
  };
};

