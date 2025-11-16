/**
 * 数据清洗工具测试
 */

import {
  sanitizeName,
  sanitizeWorkshop,
  sanitizeMaterialName,
  validateInputSecurity,
} from '../sanitize';

describe('Sanitize Utils', () => {
  describe('sanitizeName', () => {
    it('应该移除危险字符', () => {
      const input = '<script>alert("xss")</script>张三';
      const output = sanitizeName(input);

      expect(output).not.toContain('<');
      expect(output).not.toContain('>');
      expect(output).toContain('张三');
    });

    it('应该trim空格', () => {
      const input = '  张三  ';
      const output = sanitizeName(input);

      expect(output).toBe('张三');
    });

    it('应该限制长度', () => {
      const longInput = 'a'.repeat(150);
      const output = sanitizeName(longInput);

      expect(output.length).toBeLessThanOrEqual(100);
    });

    it('应该处理空字符串', () => {
      expect(sanitizeName('')).toBe('');
      expect(sanitizeName('   ')).toBe('');
    });

    it('应该移除XSS相关字符', () => {
      expect(sanitizeName('test<>')).not.toContain('<');
      expect(sanitizeName('test"')).not.toContain('"');
      expect(sanitizeName("test'")).not.toContain("'");
      expect(sanitizeName('test&')).not.toContain('&');
    });
  });

  describe('sanitizeWorkshop', () => {
    it('应该清理车间名称', () => {
      const input = '  生产车间A  ';
      const output = sanitizeWorkshop(input);

      expect(output).toBe('生产车间A');
    });

    it('应该移除危险字符', () => {
      const input = '<script>车间</script>';
      const output = sanitizeWorkshop(input);

      expect(output).not.toContain('<script>');
      expect(output).toContain('车间');
    });

    it('应该限制长度', () => {
      const longInput = '车间' + 'A'.repeat(150);
      const output = sanitizeWorkshop(longInput);

      expect(output.length).toBeLessThanOrEqual(100);
    });
  });

  describe('sanitizeMaterialName', () => {
    it('应该清理物料名称', () => {
      const input = '  原料A  ';
      const output = sanitizeMaterialName(input);

      expect(output).toBe('原料A');
    });

    it('应该移除危险字符', () => {
      const input = '<script>原料</script>';
      const output = sanitizeMaterialName(input);

      expect(output).not.toContain('<script>');
      expect(output).toContain('原料');
    });
  });

  describe('validateInputSecurity', () => {
    it('应该检测SQL关键字注入', () => {
      const result1 = validateInputSecurity('SELECT * FROM users');
      expect(result1.isValid).toBe(false);
      expect(result1.error).toContain('SQL');

      const result2 = validateInputSecurity('DROP TABLE users');
      expect(result2.isValid).toBe(false);
    });

    it('应该检测SQL注释符号', () => {
      const result1 = validateInputSecurity('admin--');
      expect(result1.isValid).toBe(false);

      const result2 = validateInputSecurity('admin; DROP TABLE');
      expect(result2.isValid).toBe(false);
    });

    it('应该检测UNION注入', () => {
      const result = validateInputSecurity('1 UNION SELECT password');
      expect(result.isValid).toBe(false);
    });

    it('应该检测XSS攻击', () => {
      const result = validateInputSecurity('<script>alert("xss")</script>');

      expect(result.isValid).toBe(false);
      expect(result.error).toBeDefined();
    });

    it('应该检测JavaScript协议', () => {
      const result = validateInputSecurity('javascript:alert(1)');
      expect(result.isValid).toBe(false);
    });

    it('应该检测事件处理器', () => {
      const result = validateInputSecurity('<img onerror=alert(1)>');
      expect(result.isValid).toBe(false);
    });

    it('应该接受安全输入', () => {
      const result = validateInputSecurity('张三');

      expect(result.isValid).toBe(true);
      expect(result.error).toBeUndefined();
    });

    it('应该接受正常的标点符号', () => {
      const result = validateInputSecurity('Hello, World!');
      expect(result.isValid).toBe(true);
    });
  });
});
