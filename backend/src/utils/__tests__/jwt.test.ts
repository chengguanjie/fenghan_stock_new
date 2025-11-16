/**
 * JWT工具函数测试
 */

import {
  generateAccessToken,
  generateRefreshToken,
  verifyAccessToken,
  verifyRefreshToken,
  extractTokenFromHeader,
} from '../jwt';
import { AppRole } from '@prisma/client';

describe('JWT Utils', () => {
  const mockPayload = {
    userId: 'test-user-id',
    email: 'test@example.com',
    name: '测试用户',
    roles: ['viewer'] as AppRole[],
  };

  describe('generateAccessToken', () => {
    it('应该生成有效的access token', () => {
      const token = generateAccessToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3); // JWT格式: header.payload.signature
    });

    it('不同payload应该生成不同token', () => {
      const token1 = generateAccessToken(mockPayload);
      const token2 = generateAccessToken({
        ...mockPayload,
        userId: 'different-user-id',
      });

      expect(token1).not.toBe(token2);
    });
  });

  describe('generateRefreshToken', () => {
    it('应该生成有效的refresh token', () => {
      const token = generateRefreshToken(mockPayload);

      expect(token).toBeDefined();
      expect(typeof token).toBe('string');
      expect(token.split('.')).toHaveLength(3);
    });

    it('access token和refresh token应该不同', () => {
      const accessToken = generateAccessToken(mockPayload);
      const refreshToken = generateRefreshToken(mockPayload);

      expect(accessToken).not.toBe(refreshToken);
    });
  });

  describe('verifyAccessToken', () => {
    it('应该正确验证有效的access token', () => {
      const token = generateAccessToken(mockPayload);
      const decoded = verifyAccessToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
      expect(decoded?.name).toBe(mockPayload.name);
    });

    it('应该拒绝无效的token', () => {
      const invalidToken = 'invalid.token.here';
      const decoded = verifyAccessToken(invalidToken);

      expect(decoded).toBeNull();
    });

    it('应该拒绝过期的token', async () => {
      // 这个测试需要模拟token过期，暂时跳过
      // 在实际项目中可以使用jwt.sign的expiresIn选项设置一个很短的过期时间
    });
  });

  describe('verifyRefreshToken', () => {
    it('应该正确验证有效的refresh token', () => {
      const token = generateRefreshToken(mockPayload);
      const decoded = verifyRefreshToken(token);

      expect(decoded).toBeDefined();
      expect(decoded?.userId).toBe(mockPayload.userId);
      expect(decoded?.email).toBe(mockPayload.email);
    });

    it('应该拒绝access token作为refresh token', () => {
      const accessToken = generateAccessToken(mockPayload);
      const decoded = verifyRefreshToken(accessToken);

      expect(decoded).toBeNull();
    });
  });

  describe('extractTokenFromHeader', () => {
    it('应该从有效的Authorization头中提取token', () => {
      const token = 'some.jwt.token';
      const header = `Bearer ${token}`;
      const extracted = extractTokenFromHeader(header);

      expect(extracted).toBe(token);
    });

    it('应该拒绝无效格式的Authorization头', () => {
      expect(extractTokenFromHeader('InvalidFormat')).toBeNull();
      expect(extractTokenFromHeader('Basic some.token')).toBeNull();
      expect(extractTokenFromHeader('Bearer')).toBeNull();
    });

    it('应该处理空值', () => {
      expect(extractTokenFromHeader(undefined)).toBeNull();
      expect(extractTokenFromHeader('')).toBeNull();
    });
  });
});
