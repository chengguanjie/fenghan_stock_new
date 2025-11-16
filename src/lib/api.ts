/**
 * API 客户端配置
 */

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080/api';

interface ApiResponse<T = unknown> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
}

class ApiClient {
  private baseUrl: string;
  private token: string | null = null;
  private isRefreshing: boolean = false;
  private refreshSubscribers: Array<(token: string) => void> = [];

  constructor(baseUrl: string) {
    this.baseUrl = baseUrl;
    // 从 localStorage 加载 token
    this.token = localStorage.getItem('access_token');
  }

  setToken(token: string | null) {
    this.token = token;
    if (token) {
      localStorage.setItem('access_token', token);
    } else {
      localStorage.removeItem('access_token');
    }
  }

  getToken(): string | null {
    return this.token;
  }

  private subscribeTokenRefresh(callback: (token: string) => void) {
    this.refreshSubscribers.push(callback);
  }

  private onTokenRefreshed(token: string) {
    this.refreshSubscribers.forEach(callback => callback(token));
    this.refreshSubscribers = [];
  }

  private async refreshToken(): Promise<string> {
    const refreshToken = localStorage.getItem('refresh_token');
    
    if (!refreshToken) {
      console.error('Token refresh failed: No refresh token available');
      throw new Error('No refresh token available');
    }

    console.log('Attempting to refresh token...');

    try {
      const response = await fetch(`${this.baseUrl}/auth/refresh`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ refreshToken }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Token refresh failed:', response.status, errorText);
        throw new Error('Token refresh failed');
      }

      const data = await response.json();
      
      if (!data.success || !data.data?.accessToken) {
        console.error('Invalid refresh response:', data);
        throw new Error('Invalid refresh response');
      }

      const newToken = data.data.accessToken;
      this.setToken(newToken);
      
      // 如果返回了新的 refresh token,也更新它
      if (data.data.refreshToken) {
        localStorage.setItem('refresh_token', data.data.refreshToken);
      }

      console.log('Token refreshed successfully');
      return newToken;
    } catch (error) {
      // 刷新失败,清除所有认证信息
      console.error('Token refresh error:', error);
      this.setToken(null);
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('current_user');
      throw error;
    }
  }

  private async request<T>(
    endpoint: string,
    options: RequestInit = {},
    isRetry: boolean = false
  ): Promise<ApiResponse<T>> {
    const url = `${this.baseUrl}${endpoint}`;
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      ...options.headers,
    };

    if (this.token) {
      headers['Authorization'] = `Bearer ${this.token}`;
    }

    try {
      const response = await fetch(url, {
        ...options,
        headers,
      });

      // 检查响应内容类型
      const contentType = response.headers.get('content-type');
      
      // 处理 401 未授权错误 - token 可能过期
      if (response.status === 401 && !isRetry) {
        console.log('Received 401 error, attempting token refresh...');
        
        // 如果正在刷新,等待刷新完成
        if (this.isRefreshing) {
          console.log('Token refresh already in progress, waiting...');
          return new Promise((resolve, reject) => {
            this.subscribeTokenRefresh((token: string) => {
              console.log('Token refreshed, retrying request...');
              // 使用新 token 重试请求
              this.request<T>(endpoint, options, true)
                .then(resolve)
                .catch(reject);
            });
          });
        }

        // 开始刷新 token
        this.isRefreshing = true;
        
        try {
          const newToken = await this.refreshToken();
          this.isRefreshing = false;
          this.onTokenRefreshed(newToken);
          
          console.log('Retrying original request with new token...');
          // 使用新 token 重试原始请求
          return this.request<T>(endpoint, options, true);
        } catch (refreshError) {
          this.isRefreshing = false;
          console.error('Token refresh failed, redirecting to login...');
          // 刷新失败,跳转到登录页
          window.location.href = '/auth';
          throw new Error('认证已过期,请重新登录');
        }
      }
      
      // 如果响应为空或不是 JSON，处理特殊情况
      if (!contentType || !contentType.includes('application/json')) {
        const text = await response.text();
        console.error('Non-JSON response:', {
          status: response.status,
          statusText: response.statusText,
          contentType,
          body: text,
          url,
        });
        
        throw new Error(
          `服务器返回非 JSON 响应 (${response.status}): ${text || response.statusText}`
        );
      }

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || data.message || '请求失败');
      }

      return data;
    } catch (error) {
      console.error('API request error:', {
        url,
        error: error instanceof Error ? error.message : error,
      });
      throw error;
    }
  }

  async get<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'GET' });
  }

  async post<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'POST',
      body: JSON.stringify(body),
    });
  }

  async put<T>(endpoint: string, body?: unknown): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, {
      method: 'PUT',
      body: JSON.stringify(body),
    });
  }

  async delete<T>(endpoint: string): Promise<ApiResponse<T>> {
    return this.request<T>(endpoint, { method: 'DELETE' });
  }
}

export const apiClient = new ApiClient(API_BASE_URL);
export type { ApiResponse };
