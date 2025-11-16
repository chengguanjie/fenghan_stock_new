import { Response } from 'express';

/**
 * 统一的 API 响应格式
 */
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: string;
  message?: string;
}

/**
 * 发送成功响应
 */
export function sendSuccess<T>(
  res: Response,
  data?: T,
  message?: string,
  statusCode: number = 200
): void {
  const response: ApiResponse<T> = {
    success: true,
    data,
    message,
  };
  res.status(statusCode).json(response);
}

/**
 * 发送错误响应
 */
export function sendError(
  res: Response,
  error: string,
  statusCode: number = 400
): void {
  const response: ApiResponse = {
    success: false,
    error,
  };
  res.status(statusCode).json(response);
}

/**
 * 处理错误并发送响应
 */
export function handleError(res: Response, error: unknown): void {
  console.error('API Error:', error);

  if (error instanceof Error) {
    sendError(res, error.message, 500);
  } else {
    sendError(res, '服务器内部错误', 500);
  }
}


