/**
 * 密码工具函数测试
 */

import { hashPassword, verifyPassword, validatePasswordStrength } from '../password';

describe('Password Utils', () => {
  describe('hashPassword', () => {
    it('应该正确哈希密码', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);

      expect(hash).toBeDefined();
      expect(hash).not.toBe(password);
      expect(hash.length).toBeGreaterThan(0);
    });

    it('相同密码应该生成不同的哈希值', async () => {
      const password = 'TestPassword123';
      const hash1 = await hashPassword(password);
      const hash2 = await hashPassword(password);

      expect(hash1).not.toBe(hash2);
    });
  });

  describe('verifyPassword', () => {
    it('应该正确验证匹配的密码', async () => {
      const password = 'TestPassword123';
      const hash = await hashPassword(password);
      const isMatch = await verifyPassword(password, hash);

      expect(isMatch).toBe(true);
    });

    it('应该拒绝不匹配的密码', async () => {
      const password = 'TestPassword123';
      const wrongPassword = 'WrongPassword456';
      const hash = await hashPassword(password);
      const isMatch = await verifyPassword(wrongPassword, hash);

      expect(isMatch).toBe(false);
    });
  });

  describe('validatePasswordStrength', () => {
    it('应该接受强密码', () => {
      expect(validatePasswordStrength('StrongPass123!').isValid).toBe(true);
      expect(validatePasswordStrength('MyP@ssw0rd').isValid).toBe(true);
      expect(validatePasswordStrength('Abcd1234@').isValid).toBe(true);
    });

    it('应该拒绝弱密码', () => {
      // 太短
      const result1 = validatePasswordStrength('Pass1');
      expect(result1.isValid).toBe(false);
      expect(result1.error).toBeDefined();

      // 无大写字母
      const result2 = validatePasswordStrength('password123');
      expect(result2.isValid).toBe(false);

      // 无小写字母
      const result3 = validatePasswordStrength('PASSWORD123');
      expect(result3.isValid).toBe(false);

      // 无数字
      const result4 = validatePasswordStrength('Password');
      expect(result4.isValid).toBe(false);

      // 空字符串
      const result5 = validatePasswordStrength('');
      expect(result5.isValid).toBe(false);
    });

    it('应该接受边界情况', () => {
      // 最小长度8字符
      expect(validatePasswordStrength('Pass123!').isValid).toBe(true);

      // 非常长的密码
      const longPassword = 'P' + 'a'.repeat(50) + '123!';
      expect(validatePasswordStrength(longPassword).isValid).toBe(true);
    });
  });
});
