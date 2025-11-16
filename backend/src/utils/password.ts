import bcrypt from 'bcryptjs';

/**
 * 密码工具类
 * 负责密码的加密和验证
 */

const SALT_ROUNDS = 10;

/**
 * 加密密码
 */
export async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, SALT_ROUNDS);
}

/**
 * 验证密码
 */
export async function verifyPassword(
  password: string,
  hash: string
): Promise<boolean> {
  return bcrypt.compare(password, hash);
}

/**
 * 验证密码复杂度
 * 要求：至少8位，包含大小写字母和数字
 */
export function validatePasswordStrength(password: string): {
  isValid: boolean;
  error?: string;
} {
  if (password.length < 8) {
    return {
      isValid: false,
      error: '密码长度至少为8位',
    };
  }

  // 检查是否包含小写字母
  if (!/[a-z]/.test(password)) {
    return {
      isValid: false,
      error: '密码必须包含小写字母',
    };
  }

  // 检查是否包含大写字母
  if (!/[A-Z]/.test(password)) {
    return {
      isValid: false,
      error: '密码必须包含大写字母',
    };
  }

  // 检查是否包含数字
  if (!/\d/.test(password)) {
    return {
      isValid: false,
      error: '密码必须包含数字',
    };
  }

  return { isValid: true };
}


