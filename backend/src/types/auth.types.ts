/**
 * 认证相关类型定义
 */

import { AppRole } from '@prisma/client';

export interface JWTPayload {
  userId: string;
  email: string;
  name: string;
  roles: AppRole[];
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginByNameRequest {
  name: string;
  password: string;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  workshop: string;
}

export interface ChangePasswordRequest {
  oldPassword: string;
  newPassword: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: {
    id: string;
    email: string;
    name: string;
    workshop: string;
    roles: AppRole[];
    forcePasswordChange: boolean;
  };
}

export interface RefreshTokenRequest {
  refreshToken: string;
}
