import jwt from 'jsonwebtoken';
import { jwtConfig } from '../config/jwt';
import { JWTPayload } from '../types/auth.types';
import { AppRole } from '@prisma/client';

/**
 * JWT 工具类
 * 负责生成和验证 JWT Token
 */

// 兼容旧代码的 JwtPayload 接口
export interface JwtPayload {
  userId: string;
  email: string;
  name: string;
  roles: AppRole[];
}

/**
 * 生成 Access Token
 */
export function generateAccessToken(payload: JWTPayload): string {
  return jwt.sign(payload, jwtConfig.accessTokenSecret, {
    expiresIn: jwtConfig.accessTokenExpiry as string | number,
    issuer: 'stock-deck-api',
  } as jwt.SignOptions);
}

/**
 * 生成 Refresh Token
 */
export function generateRefreshToken(payload: JWTPayload): string {
  return jwt.sign(payload, jwtConfig.refreshTokenSecret, {
    expiresIn: jwtConfig.refreshTokenExpiry as string | number,
    issuer: 'stock-deck-api',
  } as jwt.SignOptions);
}

/**
 * 验证 Access Token
 */
export function verifyAccessToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, jwtConfig.accessTokenSecret, {
      issuer: 'stock-deck-api',
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * 验证 Refresh Token
 */
export function verifyRefreshToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.verify(token, jwtConfig.refreshTokenSecret, {
      issuer: 'stock-deck-api',
    }) as JWTPayload;
    return decoded;
  } catch (error) {
    return null;
  }
}

/**
 * 生成 JWT Token (兼容旧代码)
 */
export function generateToken(payload: JwtPayload): string {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET 环境变量未设置');
  }

  const expiresIn = process.env.JWT_EXPIRES_IN || '24h';

  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as string | number,
    issuer: 'stock-deck-api',
  } as jwt.SignOptions);
}

/**
 * 验证 JWT Token (兼容旧代码)
 */
export function verifyToken(token: string): JwtPayload {
  const secret = process.env.JWT_SECRET;
  if (!secret) {
    throw new Error('JWT_SECRET 环境变量未设置');
  }

  try {
    const decoded = jwt.verify(token, secret, {
      issuer: 'stock-deck-api',
    }) as JwtPayload;
    return decoded;
  } catch (error) {
    if (error instanceof jwt.TokenExpiredError) {
      throw new Error('Token 已过期');
    }
    if (error instanceof jwt.JsonWebTokenError) {
      throw new Error('Token 无效');
    }
    throw new Error('Token 验证失败');
  }
}

/**
 * 从请求头中提取 Token
 */
export function extractTokenFromHeader(authorization?: string): string | null {
  if (!authorization) {
    return null;
  }

  const parts = authorization.split(' ');
  if (parts.length !== 2 || parts[0] !== 'Bearer') {
    return null;
  }

  return parts[1];
}


