/**
 * 认证服务
 */

import { apiClient } from './api';

export interface LoginByNameRequest {
  name: string;
  password: string;
}

export interface User {
  id: string;
  email: string;
  name: string;
  workshop: string;
  roles: string[];
  forcePasswordChange: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
}

export const authService = {
  /**
   * 按姓名登录
   */
  async loginByName(data: LoginByNameRequest): Promise<AuthResponse> {
    const response = await apiClient.post<AuthResponse>('/auth/login-by-name', data);
    
    if (!response.success || !response.data) {
      throw new Error(response.error || '登录失败');
    }

    // 保存 token
    apiClient.setToken(response.data.accessToken);
    localStorage.setItem('refresh_token', response.data.refreshToken);
    localStorage.setItem('current_user', JSON.stringify(response.data.user));

    return response.data;
  },

  /**
   * 登出
   */
  async logout(): Promise<void> {
    try {
      await apiClient.post('/auth/logout');
    } catch (error) {
      console.error('Logout error:', error);
    } finally {
      // 清除本地存储
      apiClient.setToken(null);
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('current_user');
    }
  },

  /**
   * 获取当前用户
   */
  getCurrentUser(): User | null {
    const userStr = localStorage.getItem('current_user');
    if (!userStr) return null;
    
    try {
      return JSON.parse(userStr);
    } catch {
      return null;
    }
  },

  /**
   * 检查是否已登录
   */
  isAuthenticated(): boolean {
    return !!apiClient.getToken();
  },

  /**
   * 修改密码
   */
  async changePassword(oldPassword: string, newPassword: string): Promise<void> {
    const response = await apiClient.post('/auth/change-password', {
      oldPassword,
      newPassword,
    });

    if (!response.success) {
      throw new Error(response.error || '修改密码失败');
    }
  },
};
