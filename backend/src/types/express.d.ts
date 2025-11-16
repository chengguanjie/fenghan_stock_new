import { JwtPayload } from '../utils/jwt';

/**
 * 扩展 Express Request 类型
 * 添加用户信息到请求对象
 */
declare global {
  namespace Express {
    interface Request {
      user?: JwtPayload;
    }
  }
}

export {};


