import { describe, it, expect } from 'vitest';

/**
 * 验证邮箱格式
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * 验证密码强度
 */
export function isStrongPassword(password: string): boolean {
  // 至少8个字符，包含大小写字母和数字
  const strongPasswordRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
  return strongPasswordRegex.test(password);
}

describe('Validation Utils', () => {
  describe('isValidEmail', () => {
    it('应该接受有效的邮箱地址', () => {
      expect(isValidEmail('test@example.com')).toBe(true);
      expect(isValidEmail('user.name@domain.co.uk')).toBe(true);
      expect(isValidEmail('user+tag@example.com')).toBe(true);
    });

    it('应该拒绝无效的邮箱地址', () => {
      expect(isValidEmail('')).toBe(false);
      expect(isValidEmail('invalid')).toBe(false);
      expect(isValidEmail('@example.com')).toBe(false);
      expect(isValidEmail('test@')).toBe(false);
      expect(isValidEmail('test @example.com')).toBe(false);
    });
  });

  describe('isStrongPassword', () => {
    it('应该接受强密码', () => {
      expect(isStrongPassword('Password123')).toBe(true);
      expect(isStrongPassword('MyP@ss123')).toBe(true);
      expect(isStrongPassword('Abcd1234')).toBe(true);
    });

    it('应该拒绝弱密码', () => {
      expect(isStrongPassword('password')).toBe(false); // 无大写字母和数字
      expect(isStrongPassword('PASSWORD')).toBe(false); // 无小写字母和数字
      expect(isStrongPassword('12345678')).toBe(false); // 无字母
      expect(isStrongPassword('Pass1')).toBe(false); // 太短
      expect(isStrongPassword('')).toBe(false); // 空字符串
    });
  });
});
